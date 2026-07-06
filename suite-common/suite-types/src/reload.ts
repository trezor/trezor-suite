export type ReloadApp = () => void;

export type ReloadAppDep = {
    reloadApp: ReloadApp;
};

export const selectReloadAppDep = (services: any): ReloadAppDep => ({
    reloadApp: services.reloadApp,
});
