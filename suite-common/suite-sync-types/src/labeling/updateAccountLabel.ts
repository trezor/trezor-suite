import { SuiteSyncStorageRepositoryDep } from '../SuiteSyncStorageRepository';

export type UpdateAccountLabelParams = {
    deviceStaticSessionId: string;
    accountKey: string;
    label: string | null;
};

export type UpdateAccountLabel = (params: UpdateAccountLabelParams) => void;

export type UpdateAccountLabelDeps = { getState: () => any } & SuiteSyncStorageRepositoryDep;

export type UpdateAccountLabelDep = { updateAccountLabel: UpdateAccountLabel };
