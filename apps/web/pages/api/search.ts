import type { NextApiRequest, NextApiResponse } from 'next'
import { TrieveChunk, VentureCapitalist } from '@trieve-openvc/schemas'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrieveChunk[] | null>
) {
    try {
      const data = req.query
      const query = data['query']
      const page = data['page']
      if (query) {
        const response = await fetch("https://api.trieve.ai/api/chunk/search", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "TR-Organization": process.env.TRIEVE_ORGANIZATION_ID!,
              "TR-Dataset": process.env.TRIEVE_DATASET_ID!,
              Authorization: process.env.TRIEVE_API_KEY!,
          },
          body: JSON.stringify({
            query,
            search_type: 'hybrid',
            page: parseInt(page as string),
            slim_chunks: true,
          }),
        });
        const results = await response.json()
        res.status(200).json(results.score_chunks.map((chunk: any) => chunk.metadata[0]))
      }
    } catch (e) { 
      console.log(e)
    }
    res.status(404).json(null)
}