import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ 
		loader: docsLoader(), 
		schema: docsSchema({
			extend: z.object({
				date: z.coerce.date().optional(),
				authors: z.array(z.string()).optional(),
				featured: z.boolean().optional(),
				excerpt: z.string().optional(),
			}),
		}),
	}),
};
