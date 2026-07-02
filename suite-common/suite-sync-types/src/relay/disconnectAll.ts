export type DisconnectAll = () => Promise<void>;

export type DisconnectAllDep = {
    disconnectAll: DisconnectAll;
};

export const selectDisconnectAllDep = (services: any): DisconnectAllDep => ({
    disconnectAll: services.suiteSync.disconnectAll,
});
