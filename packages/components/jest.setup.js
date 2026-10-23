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
// returns null, and the repo does not pull in the optional `canvas` package. Any test that loads
// `lottie-react` (e.g. by rendering `LottieAnimation`) needs this: Jest resolves its CJS entry, which
// requires every engine build including the full `lottie-web` player, and that writes to a canvas
// context while it is being imported, failing the suite before any test runs.
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
