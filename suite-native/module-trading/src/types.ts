import { CoinInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { TradingPaymentMethodListProps } from '@suite-common/trading';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';
import { Address } from '@trezor/blockchain-link-types';

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

export type TradingBuyFormValues = {
    asset: TradeableAsset;
    receiveAccount: ReceiveAccount | undefined;
    fiatCurrency: FiatCurrencyCode;
    fiatValue: string;
    cryptoValue: string;
    paymentMethod: TradingPaymentMethodListProps;
    country: Country;
    provider: string;
};

export type TradingBuyForm = UseFormReturn<TradingBuyFormValues>;

export type FiatCurrencyItem = {
    value: FiatCurrencyCode;
    displayValue: string;
    label: string;
};
