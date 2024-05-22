import { expect, test } from "bun:test";
import { load } from 'cheerio'
import { extractVCLinks, extractVCDetails, fetchOpenVCDetailHTML, fetchOpenVCHTML } from "./scrape";
import { VentureCapitalistSchema } from "../schemas";
//@ts-expect-error
import openvc from "../stubs/openvc.html" with { type: "text" };
//@ts-expect-error
import brickyard from "../stubs/brickyard.html" with { type: "text" };
import { sleep } from "bun";

test("extractVCLinks", () => {
    const links = extractVCLinks(openvc)
    expect(links.length).toBe(5586);
});

test("extractVCDetails", () => {
    const vc = extractVCDetails(brickyard)
    expect(VentureCapitalistSchema.safeParse(vc).success).toBeTrue()
})

// Fetching
test("fetchOpenVCDetailHTML", async () => {
    const link = 'https://www.openvc.app/fund/GoHub%20Ventures'
    const vc = extractVCDetails(await fetchOpenVCDetailHTML(link))
    expect(VentureCapitalistSchema.safeParse(vc).success).toBeTrue()
})

// Fetching
test("fetchOpenVCHTML", async () => {
    const links = extractVCLinks(await fetchOpenVCHTML()).slice(0, 3)
    for (const link of links) {
        await sleep(1000)
        const html = await fetchOpenVCDetailHTML(link)
        if (html) {
            const vc = extractVCDetails(html)
            expect(VentureCapitalistSchema.safeParse(vc).success).toBeTrue()
        } else console.log('Failed:', link)
    }
})
