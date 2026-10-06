import '@testing-library/jest-dom';

// jsdom implements no IntersectionObserver, while components that watch the edges of their own
// scrollable content — the scroll shadows of `useScrollShadow` — construct one as they mount.
if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
            return [];
        }
    };
}
