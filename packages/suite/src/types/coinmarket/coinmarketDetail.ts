import type { CoinmarketTradeCommonProps } from 'src/reducers/wallet/coinmarketReducer';
import type { Account } from 'src/types/wallet';
import type { TradeType } from 'src/types/wallet/coinmarketCommonTypes';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

import {
    CoinmarketTradeInfoMapProps,
    CoinmarketTradeMapProps,
    CoinmarketTradeType,
} from './coinmarket';

export interface CoinmarketDetailContextValues<T extends CoinmarketTradeType>
    extends CoinmarketTradeCommonProps {
    account: Account;
    trade: CoinmarketTradeMapProps[T] | undefined;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
}

export interface CoinmarketGetDetailDataOutputProps<T extends CoinmarketTradeType> {
    transactionId?: string;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
    trade?: CoinmarketTradeMapProps[T] | undefined;
}

export interface CoinmarketUseDetailProps {
    selectedAccount: SelectedAccountLoaded;
    tradeType: TradeType;
}

export interface CoinmarketUseDetailOutputProps<T extends CoinmarketTradeType> {
    transactionId: string | undefined;
    info: CoinmarketTradeInfoMapProps[T] | undefined;
    trade: CoinmarketTradeMapProps[T] | undefined;
    account: Account;
}
