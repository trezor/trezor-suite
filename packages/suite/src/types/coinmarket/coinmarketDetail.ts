import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import type { TradingType } from '@suite-common/invity';

import type { CoinmarketTradeCommonProps } from 'src/reducers/wallet/coinmarketReducer';
import type { Account } from 'src/types/wallet';
import type { TradeType } from 'src/types/wallet/coinmarketCommonTypes';
import {
    CoinmarketTradeInfoMapProps,
    CoinmarketTradeMapProps,
} from 'src/types/coinmarket/coinmarket';

export interface CoinmarketDetailContextValues<T extends TradingType>
    extends CoinmarketTradeCommonProps {
    account: Account;
    trade: CoinmarketTradeMapProps[T] | undefined;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
}

export interface CoinmarketGetDetailDataOutputProps<T extends TradingType> {
    transactionId?: string;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
    trade?: CoinmarketTradeMapProps[T] | undefined;
}

export interface CoinmarketUseDetailProps {
    selectedAccount: SelectedAccountLoaded;
    tradeType: TradeType;
}

export interface CoinmarketUseDetailOutputProps<T extends TradingType> {
    transactionId: string | undefined;
    info: CoinmarketTradeInfoMapProps[T] | undefined;
    trade: CoinmarketTradeMapProps[T] | undefined;
    account: Account;
}
