import type { BaseCurrencyAmount } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import type { AggregatedAccountHistory, AggregatedDashboardHistory } from 'src/types/wallet/graph';

export type FiatValueMap = { [K in BaseCurrencyCode]?: BaseCurrencyAmount | undefined };

export type ObjectType<T> = T extends 'account'
    ? AggregatedAccountHistory
    : T extends 'dashboard'
      ? AggregatedDashboardHistory
      : never;

export type TypeName = 'account' | 'dashboard';
