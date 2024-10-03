import { CryptoId } from 'invity-api';
import { CoinmarketTradeType } from './coinmarket';
import {
    CoinmarketBuyFormContextProps,
    CoinmarketExchangeFormContextProps,
    CoinmarketSellFormContextProps,
} from './coinmarketForm';

export type CoinmarketBuyAddressOptionsType = {
    address?: string;
};

export type CoinmarketSellStepType = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export type CoinmarketExchangeStepType =
    | 'RECEIVING_ADDRESS'
    | 'SEND_TRANSACTION'
    | 'SEND_APPROVAL_TRANSACTION';

// TODO: delete
export type CoinmarketOffersMapProps = {
    buy: CoinmarketBuyFormContextProps; // temporary
    sell: CoinmarketSellFormContextProps; // temporary
    exchange: CoinmarketExchangeFormContextProps; // temporary
};

export type CoinmarketOffersContextValues<T extends CoinmarketTradeType> =
    CoinmarketOffersMapProps[T];

export interface CoinmarketCryptoAmountProps {
    amountInCrypto?: boolean | undefined;
    sendAmount: string | number | undefined;
    sendCurrency: CryptoId | string | undefined;
    receiveAmount: string | number | undefined;
    receiveCurrency: CryptoId | undefined;
    className?: string;
}
