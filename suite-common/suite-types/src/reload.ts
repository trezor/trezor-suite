export type ReloadApp = () => void;

export type ReloadAppDep = {
    reloadApp: ReloadApp;
};

export const injectReloadApp = (services: any): ReloadAppDep => ({
    reloadApp: services.reloadApp,
});
