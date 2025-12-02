import { TrezorDeviceWithState } from '@suite-common/suite-types';

import { CreateSuiteSyncOwner } from './Owner';
import { SuiteSyncStorageRepository } from './SuiteSyncStorageRepository';

export type ChangeRelayUrl = (params: { relayUrl: string | null }) => Promise<void>;

export type SubscribeSuiteSyncStorage = (params: {
    device: TrezorDeviceWithState;
}) => Promise<void>;

export type UnsubscribeSuiteSyncStorage = (params: {
    device: TrezorDeviceWithState;
}) => Promise<void>;

export type TurnOfSuiteSync = () => Promise<void>;

export type SuiteSync = {
    changeRelayUrl: ChangeRelayUrl;
    suiteSyncStorageRepository: SuiteSyncStorageRepository;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    subscribeSuiteSyncStorage: SubscribeSuiteSyncStorage;
    unsubscribeSuiteSyncStorage: UnsubscribeSuiteSyncStorage;
    turnOffSuiteSync: TurnOfSuiteSync;
};
