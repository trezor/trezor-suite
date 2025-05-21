import { CoinInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import { Formatters } from '@suite-common/formatters';
import { TradingAmountLimitProps } from '@suite-common/trading';
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

export type FocusableFormValues<T extends string> = {
    focusedValue: T | undefined;
} & Record<Exclude<T, 'focusedValue'>, string | undefined>;

export type GenericForm<T extends string> = UseFormReturn<FocusableFormValues<T>>;

export type FormContext = (TradingAmountLimitProps | Record<string, never>) & {
    translate: ReturnType<typeof useTranslate>['translate'];
    FiatAmountFormatter: Formatters['FiatAmountFormatter'];
    CryptoAmountFormatter: Formatters['CryptoAmountFormatter'];
};

export type FiatCurrencyItem = {
    value: FiatCurrencyCode;
    displayValue: string;
    label: string;
};
