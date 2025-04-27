import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Use the Cloudflare adapter
    adapter: adapter({
      // See adapter options below
      routes: {
        include: ['/*'], // Include all routes by default
        exclude: ['<all>'] // Exclude default Cloudflare asset handling if needed
      }
    })
    // You might have other kit options here
  }
};

export default config;
