import { CreateSuiteSyncOwner } from './Owner';
import { SuiteSyncStorageRepository } from './SuiteSyncStorageRepository';

export type ChangeRelayUrl = (params: { relayUrl: string | null }) => Promise<void>;

export interface ChangeRelayUrlDep {
    changeRelayUrl: ChangeRelayUrl;
}

export type SuiteSync = {
    changeRelayUrl: ChangeRelayUrl;
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
};
