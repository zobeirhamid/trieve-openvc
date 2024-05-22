import z from 'zod'
export const VentureCapitalistSchema = z.object({
    name: z.string(),
    logo: z.string().optional(),
    description: z.string().optional(),
    value: z.string().optional(),
    types: z.array(z.string()).optional(),
    address: z.string().optional(),
    thesis: z.string().optional(),
    stages: z.array(z.string()).optional(),
    check: z.string().optional(),
    countries: z.array(z.string()).optional(),
    website: z.string().optional(),
})
