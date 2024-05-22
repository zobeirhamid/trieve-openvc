import { load, type CheerioAPI } from 'cheerio'
import path from 'path'
import type { TrieveChunk, VentureCapitalist } from '../types'
import { sleep } from 'bun'
import { VentureCapitalistSchema } from '../schemas'

const headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }

async function fetchOpenVCHTML() {
    const response = await fetch('https://www.openvc.app/search', { headers })
    return await response.text()
}

async function fetchOpenVCDetailHTML(link: string, retry = 5) {
    const response = await fetch(link, { headers })
    const html = await response.text()
    if (html.includes('<title>Just a moment...</title>')) {
        if (retry) {
            await sleep((1 + (Math.random() * 2)) * 1000)
            return await fetchOpenVCDetailHTML(link, retry - 1)
        }

        return ''
    }
    return html
}

export function extractVCLinks(html: string): string[] {
    const links: string[] = []
    const $ = load(html)
    $('.VClink').each((index, anchor) => {
        const rawLink = $(anchor).attr('href')
        if (rawLink) links[index] = path.join('https://www.openvc.app/', rawLink)
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
    if (rawLogo) vc['logo'] = path.join('https://www.openvc.app/', rawLogo)

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
            if (pair.key && pair.key in openVCMap) {
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
        const html = await fetchOpenVCDetailHTML(link)
        if (html) {
            const vc = extractVC(html)
            if(VentureCapitalistSchema.safeParse(vc).success) chunks.push({ link, chunkHTML: html, metadata: vc})
        } else console.log('Failed:', link)
    }
    return chunks
}