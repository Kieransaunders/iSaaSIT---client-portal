// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://isaasit.com',
  base: '/docs',
  server: {
    port: 4321,
  },
  integrations: [
    starlight({
      title: 'iSaaSIT',
      description: 'Documentation for iSaaSIT - SaaS starter pack for agencies building client portals',
      logo: {
        src: './src/assets/houston.webp',
        replacesTitle: true,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Kieransaunders/iSaaSIT' },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Quick Start', slug: 'guides/quick-start' },
            { label: 'Architecture', slug: 'guides/architecture' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Authentication', slug: 'features/authentication' },
            { label: 'Organizations', slug: 'features/organizations' },
            { label: 'Customer Management', slug: 'features/customers' },
            { label: 'Role-Based Access', slug: 'features/rbac' },
            { label: 'User Impersonation', slug: 'features/user-impersonation' },
            { label: 'Billing', slug: 'features/billing' },
          ],
        },
        {
          label: 'Development',
          items: [
            { label: 'Project Structure', slug: 'development/structure' },
            { label: 'Convex Backend', slug: 'development/convex' },
            { label: 'Frontend Guide', slug: 'development/frontend' },
            { label: 'Environment Setup', slug: 'development/environment' },
            { label: 'Tools', slug: 'development/tools' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', slug: 'reference/api' },
          ],
        },
      ],
      plugins: [
        starlightBlog({
          title: 'Blog',
          customCss: ['./src/styles/blog.css'],
          authors: {
            kieran: {
              name: 'Kieran',
              title: 'Creator @ iSaaSIT',
              picture: '/favicon.svg',
              url: 'https://github.com/Kieransaunders',
            },
          },
        }),
      ],
      customCss: [
        './src/styles/tailwind.css',
      ],
    }),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
});
