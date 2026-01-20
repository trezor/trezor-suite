export type SuiteSyncStorageFlusher = () => void;

export type SuiteSyncStorageFlusherDep = {
    flushSuiteSyncStorage: SuiteSyncStorageFlusher;
};
