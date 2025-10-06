// Global polyfills for the suite

// Polyfill for Array.prototype.toSorted
if (!Array.prototype.toSorted) {
    Object.defineProperty(Array.prototype, 'toSorted', {
        value: function toSorted(compareFn: (a: any, b: any) => number) {
            return [...this].sort(compareFn);
        },
        writable: true,
        configurable: true,
    });
}
