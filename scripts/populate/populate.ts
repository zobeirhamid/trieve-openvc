import { load } from 'cheerio'
import { sleep } from 'bun'
import { VentureCapitalistSchema, type TrieveChunk, type VentureCapitalist  } from "@trieve-openvc/schemas"
import fs from 'fs'
import path from 'path'

const headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
const cacheDir = './cache'

export async function fetchOpenVCHTML() {
    const response = await fetch('https://www.openvc.app/search', { headers })
    return await response.text()
}

export async function fetchOpenVCDetailHTML(link: string, retry = 5) {
    const cache = path.join(cacheDir, link.split('/').pop()!)
    if (fs.existsSync(cache)) return fs.readFileSync(cache, 'utf-8').toString()
    const response = await fetch(link, { headers })
    const html = await response.text()
    if (html.includes('<title>Just a moment...</title>')) {
        if (retry) {
            await sleep((1 + (Math.random() * 2)) * 1000)
            return await fetchOpenVCDetailHTML(link, retry - 1)
        }

        return ''
    }
    fs.writeFileSync(cache, html)
    return html
}

export function extractVCLinks(html: string): string[] {
    const links: string[] = []
    const $ = load(html)
    $('.VClink').each((index, anchor) => {
        const rawLink = $(anchor).attr('href')
        if (rawLink) links[index] = new URL(rawLink, 'https://www.openvc.app/').href
    })
    return links.filter((link, index) => links.indexOf(link) === index)
}


const openVCMap: {[key: string]: [keyof VentureCapitalist, (raw: any) => any]} = {
    'Who we are': ['description', (raw: string) => raw.trim()],
    'Value add': ['value', (raw: string) => raw.trim()],
    'Firm type': ['types', (raw: string) => raw.split(',').map(part => part.trim())],
    'Global HQ': ['address', (raw: string) => raw.trim()],
    'Funding requirements': ['thesis', (raw: string) => raw.trim()],
    'Funding stages': ['stages', (raw: string[]) => raw.map(part => part.slice(3).trim())],
    'Check size': ['check', (raw: string) => raw.trim()],
    'Target countries': ['countries', (raw: string[]) => raw.map(part => part.trim())],
    'Website': ['website', (raw: string) => raw.trim()],
}

export function extractVC(html: string): VentureCapitalist {
    const $ = load(html)
    const name = $('h1').text()
    const vc: VentureCapitalist = { name }

    const rawLogo = $('#fundHeader img').attr('src')
    if (rawLogo) vc['logo'] = new URL(rawLogo, 'https://www.openvc.app/').href

    const tables = $('.fundDetail')
    tables.each((tableIndex, table) => {
        $(table).find('tr').each((rowIndex, row) => {
            const pair: { key?: string, value?: any } = {}

            $(row).find('td').each((columnIndex, column) => {
                if (columnIndex === 0) pair.key = $(column).text()
                else {
                    const parts: string[] = []
                    $(column).find('span').each((spanIndex, span) => {
                        const part = $(span).text()
                        if (part) parts.push(part)
                    })
                    const paragraph = $(column).find('p').first().text()
                    if (paragraph) pair.value = paragraph
                    else pair.value = parts.length ? parts : $(column).text()
                }
            
            })
            if (pair.key && pair.key in openVCMap && pair.value && pair.value !== 'N/A') {
                vc[openVCMap[pair.key][0]] = openVCMap[pair.key][1](pair.value)
            }
        })

    })

    Object.entries(vc).forEach(([key, value])=> {
        if (!value || value === 'N/A') delete vc[key as keyof VentureCapitalist]
    })

    return vc
}

export async function scrapeTrieveChunks(links: string[]) {
    const chunks: TrieveChunk[] = []
    for (const link of links) {
        console.log(link)
        const html = await fetchOpenVCDetailHTML(link)
        if (html) {
            const vc = extractVC(html)
            if(VentureCapitalistSchema.safeParse(vc).success) {
                let chunkHTML = ''
                if (vc.name) chunkHTML += `<h1>${vc.name}</h1>`
                if (vc.description) chunkHTML += `<p>${vc.description}.</p>`
                if (vc.thesis) chunkHTML += `<p>${vc.thesis}.</p>`
                if (vc.address) chunkHTML += `<p>Located in ${vc.address}.</p>`
                if (vc.check) chunkHTML += `<p>Check size is ${vc.check}.</p>`
                if (vc.stages) chunkHTML += `<p>Invest in ${vc.stages.join(', ')}.</p>`
                chunkHTML = `<div>${chunkHTML}</div>`
                const tagSet: string[] = []
                if (vc.stages) tagSet.push(...vc.stages)
                if (vc.countries) tagSet.push(...vc.countries)
                chunks.push({ 
                    link, 
                    chunk_html: chunkHTML, 
                    tag_set: tagSet,
                    metadata: vc
                })
            }
        } else console.log('Failed:', link)
    }
    return chunks
}


if (import.meta.main) {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const MAX_CHUNKS = Infinity
    const BULK_SIZE = 120

    const links = extractVCLinks(await fetchOpenVCHTML()).slice(0, MAX_CHUNKS)
    const chunks = await scrapeTrieveChunks(links)
    for (let offset = 0; offset < chunks.length; offset += BULK_SIZE) {
        const response = await fetch("https://api.trieve.ai/api/chunk", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "TR-Organization": process.env.TRIEVE_ORGANIZATION_ID!,
                "TR-Dataset": process.env.TRIEVE_DATASET_ID!,
                Authorization: process.env.TRIEVE_API_KEY!,
            },
            body: JSON.stringify(chunks.slice(offset, offset + BULK_SIZE)),
        });
    }
}