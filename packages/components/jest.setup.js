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

// jsdom ships no canvas implementation: `getContext` exists but only logs "not implemented" and
// returns null, and the repo does not pull in the optional `canvas` package. `lottie-web` — which
// `Spinner` imports, and so does every component that can render a loading state — writes to that
// context while it is being imported, failing the whole suite before any test runs.
HTMLCanvasElement.prototype.getContext = () => ({
    canvas: document.createElement('canvas'),
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    measureText: () => ({ width: 0 }),
});
