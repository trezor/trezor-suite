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
): LazyComponentByName<TModule, TName> => ({
    LazyComponent: lazy(async () => ({
        default: (await importModule())[name] as Extract<TModule[TName], ComponentType<any>>,
    })),
    load: importModule,
    preload: () => {
        importModule().catch(() => undefined);
    },
});
