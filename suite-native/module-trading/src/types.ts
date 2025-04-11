import { CoinInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { Formatters } from '@suite-common/formatters';
import { TradingAmountLimitProps, TradingPaymentMethodListProps } from '@suite-common/trading';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
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
    quoteId: string | undefined;
    asset: TradeableAsset | undefined;
    receiveAccount: ReceiveAccount | undefined;
    fiatCurrency: FiatCurrencyCode;
    fiatValue: string | undefined;
    cryptoValue: string | undefined;
    amountInCrypto: boolean;
    focusedValue: 'fiatValue' | 'cryptoValue' | undefined;
    paymentMethod: TradingPaymentMethodListProps | undefined;
    country: Country;
    provider: string | undefined;
    generalAlert: string | undefined;
};

export type TradingBuyFormContext = (TradingAmountLimitProps | Record<string, never>) & {
    translate: ReturnType<typeof useTranslate>['translate'];
    FiatAmountFormatter: Formatters['FiatAmountFormatter'];
    CryptoAmountFormatter: Formatters['CryptoAmountFormatter'];
};

export type TradingBuyForm = UseFormReturn<TradingBuyFormValues>;

export type FiatCurrencyItem = {
    value: FiatCurrencyCode;
    displayValue: string;
    label: string;
};
