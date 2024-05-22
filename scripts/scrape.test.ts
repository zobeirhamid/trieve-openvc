import { expect, test } from "bun:test";
import { extractVCLinks, extractVC, scrapeTrieveChunks } from "./scrape";
import { TrieveChunkSchema, VentureCapitalistSchema } from "../schemas";
//@ts-expect-error
import openvc from "../stubs/openvc.html" with { type: "text" };
//@ts-expect-error
import brickyard from "../stubs/brickyard.html" with { type: "text" };

test("extractVCLinks", () => {
    const links = extractVCLinks(openvc)
    expect(links.length).toBe(5586);
});

test("extractVC", () => {
    const vc = extractVC(brickyard)
    expect(VentureCapitalistSchema.safeParse(vc).success).toBeTrue()
})

// Fetching
test("scrapeTrieveChunks", async () => {
    const links = ["https:/www.openvc.app/fund/RATP%20Capital%20Innovation", "https:/www.openvc.app/fund/Triventures", "https:/www.openvc.app/fund/Vitulum%20Ventures"]
    const chunks = await scrapeTrieveChunks(links)
    for (const chunk of chunks) {
        expect(TrieveChunkSchema.safeParse(chunk).success).toBeTrue()
    }
})