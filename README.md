# WebPing

A simple web application to monitor the status and response time of a list of domains.

## Features

*   Add domains to monitor via the input field.
*   Displays real-time status (Up ✅ / Down ❌) for each domain.
*   Shows response time in milliseconds for successful checks.
*   Provides detailed status reasons on hover over the status icon (e.g., OK, Timeout, DNS/Network Error, HTTP Error, SSL Error).
*   Uses a retry mechanism (up to 3 attempts) for failed checks.
*   Basic responsive design.

## Technologies Used

*   [SvelteKit](https://kit.svelte.dev/): Web application framework.
*   [Svelte 5](https://svelte.dev/): UI compiler.
*   [TypeScript](https://www.typescriptlang.org/): Superset of JavaScript for static typing.
*   [Vite](https://vitejs.dev/): Frontend build tool.
*   [PNPM](https://pnpm.io/): Package manager.
*   Node.js `fetch`: For making HTTP requests in the backend API route.
*   Basic CSS/HTML

## Developing

Once you've cloned the project and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
