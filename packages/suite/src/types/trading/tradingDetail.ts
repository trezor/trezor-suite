import type { TradingType } from '@suite-common/trading';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

import type { TradingTradeCommonProps } from 'src/reducers/wallet/tradingReducer';
import { TradingTradeInfoMapProps, TradingTradeMapProps } from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import type { TradeType } from 'src/types/wallet/tradingCommonTypes';

export interface TradingDetailContextValues<T extends TradingType> extends TradingTradeCommonProps {
    account: Account;
    trade: TradingTradeMapProps[T] | undefined;
    info?: TradingTradeInfoMapProps[T] | undefined;
}

export interface TradingGetDetailDataOutputProps<T extends TradingType> {
    transactionId?: string;
    info?: TradingTradeInfoMapProps[T] | undefined;
    trade?: TradingTradeMapProps[T] | undefined;
}

export interface TradingUseDetailProps {
    selectedAccount: SelectedAccountLoaded;
    tradeType: TradeType;
}

export interface TradingUseDetailOutputProps<T extends TradingType> {
    transactionId: string | undefined;
    info: TradingTradeInfoMapProps[T] | undefined;
    trade: TradingTradeMapProps[T] | undefined;
    account: Account;
}
