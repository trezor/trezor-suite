// Shared by playwright.config.ts and vite.config.mts. Kept free of `import.meta` so Playwright's
// CommonJS config loader can require it.
export const GALLERY_PORT = 5199;

export const GALLERY_URL = `http://localhost:${GALLERY_PORT}/index.html`;
