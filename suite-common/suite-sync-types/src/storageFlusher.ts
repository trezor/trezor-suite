export type StorageFlusher = () => void;

export type StorageFlusherDep = {
    flushSuiteSyncStorage: StorageFlusher;
};
