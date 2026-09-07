import { type tradeStatusEvent } from '@suite/analytics';
import { type EventInstance } from '@suite-common/analytics';
import type { TradingType } from '@suite-common/trading';

import {
    type TradingTradeInfoMapProps,
    type TradingTradeMapProps,
} from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';

export type TradingDetailContextValues<T extends TradingType> = {
    account: Account | undefined;
    trade: TradingTradeMapProps[T] | undefined;
    info?: TradingTradeInfoMapProps[T] | undefined;
};

export type TradingDetailStatusStep = EventInstance<typeof tradeStatusEvent>['payload']['status'];
