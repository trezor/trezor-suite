// Web only. Do not import in native — native uses the icon font (codepoints).
//
// Dynamic import() with a template literal creates lazy chunks in both bundlers:
//   • Vite/Rolldown — handled by the built-in @rollup/plugin-dynamic-import-vars
//   • Webpack       — handled by a dynamic require context
// Only SVGs for icons that are actually rendered get loaded.

const iconCache = new Map<string, string>();

export const loadIcon = (name: string): Promise<string> => {
    const cached = iconCache.get(name);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }

    return (import(`../assets/${name}.svg`) as Promise<any>).then(mod => {
        const url = (mod.default ?? mod) as string;
        iconCache.set(name, url);

        return url;
    });
};

export const getCachedIcon = (name: string): string | undefined => iconCache.get(name);
