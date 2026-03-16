import type { TradingType } from '@suite-common/trading';

import {
    type TradingTradeInfoMapProps,
    type TradingTradeMapProps,
} from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';

export interface TradingDetailContextValues<T extends TradingType> {
    account: Account;
    trade: TradingTradeMapProps[T] | undefined;
    info?: TradingTradeInfoMapProps[T] | undefined;
}
