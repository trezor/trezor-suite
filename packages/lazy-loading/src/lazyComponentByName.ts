import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

/** The exports of `TModule` that are React components, so a typo in the name does not compile. */
type ComponentExportNames<TModule> = {
    [TName in keyof TModule]: TModule[TName] extends ComponentType<any> ? TName : never;
}[keyof TModule];

/**
 * Generic over the module and export name, not over the component's props: a props type is often
 * a local alias the module does not export, which `tsc` then cannot name (TS4023).
 */
export type LazyComponentByName<TModule, TName extends keyof TModule> = {
    LazyComponent: LazyExoticComponent<Extract<TModule[TName], ComponentType<any>>>;
    /** Resolves with the whole module, not the component: callers only await the chunk. */
    load: () => Promise<TModule>;
    preload: () => void;
};

/**
 * `React.lazy` for a named export. The `import()` stays literal at the call site so its
 * `webpackChunkName` survives; only the export pick moves here. The pick is a runtime key, so the
 * bundler keeps all of the module's exports — free for one component, costly for a barrel.
 */
export const lazyComponentByName = <
    TModule,
    TName extends ComponentExportNames<TModule> & keyof TModule,
>(
    importModule: () => Promise<TModule>,
    name: TName,
): LazyComponentByName<TModule, TName> => {
    type LoadedComponent = { default: Extract<TModule[TName], ComponentType<any>> };

    let loaded: { module: TModule } | undefined;

    const load = () =>
        importModule().then(module => {
            loaded = { module };

            return module;
        });

    const pick = (module: TModule): LoadedComponent => ({
        default: module[name] as LoadedComponent['default'],
    });

    return {
        LazyComponent: lazy(() => {
            if (!loaded) return load().then(pick);

            // lazy() renders at once from a thenable that settles synchronously; a Promise settles a microtask later.
            const component = pick(loaded.module);
            const settled = {
                then: (resolve: (value: LoadedComponent) => void) => resolve(component),
            };

            return settled as unknown as Promise<LoadedComponent>;
        }),
        load,
        preload: () => {
            load().catch(() => undefined);
        },
    };
};
