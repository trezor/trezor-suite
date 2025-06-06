import { CoinInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { TradingTradeType } from '@suite-common/trading';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { Address } from '@trezor/blockchain-link-types';

import { BuyFormType } from './buy';
import { ExchangeFormType } from './exchange';

export type TradeableAsset = {
    symbol: NetworkSymbolExtended;
    contractAddress?: TokenAddress | undefined;
    cryptoId: CryptoId;
    networkId: string;
} & Omit<CoinInfo, 'symbol' | 'services'>;

export type Country = { label: string; value: string };

export type ReceiveAccount = {
    account: Account;
    address?: Address;
};

export type FiatCurrencyItem = {
    value: FiatCurrencyCode;
    displayValue: string;
    label: string;
};

export type BaseFormValues<FocusedValue extends string, Quote extends TradingTradeType> = {
    quote: Quote | undefined;
    generalAlert: string | undefined;
    focusedValue: FocusedValue | undefined;
} & Record<FocusedValue, string | undefined>;

export type GeneralFormType = BuyFormType | ExchangeFormType;
