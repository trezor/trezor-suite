import { CoinmarketTradeCommonProps } from 'src/reducers/wallet/coinmarketReducer';
import {
    CoinmarketTradeInfoMapProps,
    CoinmarketTradeMapProps,
    CoinmarketTradeType,
} from './coinmarket';
import { Account } from '@suite-common/wallet-types';

export interface CoinmarketOffersContextValues<T extends CoinmarketTradeType>
    extends CoinmarketTradeCommonProps {
    account: Account;
    trade: CoinmarketTradeMapProps[T] | undefined;
    info?: CoinmarketTradeInfoMapProps[T] | undefined;
}
