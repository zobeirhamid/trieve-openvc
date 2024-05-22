import z from 'zod'
import type { VentureCapitalistSchema } from './schemas'
export type VentureCapitalist = z.infer<typeof VentureCapitalistSchema>