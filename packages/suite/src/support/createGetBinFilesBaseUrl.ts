import { type GetBinFilesBaseUrl } from '@suite-common/suite-types';

type CreateGetBinFilesBaseUrlDeps<TState> = {
    getState: () => TState;
};

/**
 * Temporary initialization adapter. The desktop implementation of `GetBinFilesBaseUrl` reads its
 * value from Redux, but the desktop composition root must call `initStore` before `getState`
 * exists. `initStore` therefore uses this factory after Redux provides its store API. Replace this
 * with a direct `GetBinFilesBaseUrlDep` when the desktop bin directory can be obtained without
 * reading the newly created store.
 */
export type CreateGetBinFilesBaseUrl<TState> = (
    deps: CreateGetBinFilesBaseUrlDeps<TState>,
) => GetBinFilesBaseUrl;

export type CreateGetBinFilesBaseUrlDep<TState> = {
    createGetBinFilesBaseUrl: CreateGetBinFilesBaseUrl<TState>;
};
