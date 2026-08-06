import { type GroupedBalanceMovementEventPayload } from '@suite-common/graph';

export type TimeframeHoursValue = number | null;

export type StoredFiatGraphPoint = {
    date: number;
    value: number;
    cryptoBalance?: string;
};

export type StoredGroupedBalanceMovementEvent = {
    date: number;
    payload: GroupedBalanceMovementEventPayload;
};
