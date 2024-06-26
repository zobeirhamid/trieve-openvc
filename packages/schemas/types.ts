import z from 'zod'
import type { TrieveChunkSchema, VentureCapitalistSchema } from './openVCSchema.ts'
export type VentureCapitalist = z.infer<typeof VentureCapitalistSchema>
export type TrieveChunk = z.infer<typeof TrieveChunkSchema>