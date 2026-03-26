export const rozeniteDevToolsEnhancer =
    () =>
    (createStore: any) =>
    (...args: any[]) =>
        createStore(...args);
