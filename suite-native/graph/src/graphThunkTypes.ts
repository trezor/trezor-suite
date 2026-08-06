import { type AccountItem, type FetchGraphDataParams } from '@suite-common/graph';

import { type GraphInstanceId } from './graphInstances';
import {
    type StoredFiatGraphPoint,
    type StoredGroupedBalanceMovementEvent,
    type TimeframeHoursValue,
} from './types';

export enum RefetchGraphThunkStatus {
    Fetched = 'fetched',
    Interrupted = 'interrupted',
    WaitingForDiscovery = 'waitingForDiscovery',
}

export type RefetchGraphThunkResult =
    | {
          status: RefetchGraphThunkStatus.Fetched;
          points: StoredFiatGraphPoint[];
          events?: StoredGroupedBalanceMovementEvent[];
      }
    | {
          status: RefetchGraphThunkStatus.Interrupted | RefetchGraphThunkStatus.WaitingForDiscovery;
      };

export type RefetchGraphThunkParams = {
    instanceId: GraphInstanceId;
    accounts: AccountItem[];
    eventsAccount?: AccountItem;
    isDiscoveryRunning?: boolean;
    timeframeHours: TimeframeHoursValue;
    isElectrumBackend: boolean;
    baseCurrencyCode: FetchGraphDataParams['baseCurrencyCode'];
    forceRefetch?: boolean;
};
