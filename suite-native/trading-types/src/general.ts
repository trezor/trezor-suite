import type { CoinInfo, CryptoId, FiatCurrencyCode } from 'invity-api';

import type { Formatters } from '@suite-common/formatters';
import type {
    TradingAmountLimitProps,
    TradingCountryOption,
    TradingCountrySubdivisionOption,
    TradingTradeType,
} from '@suite-common/trading';
import type { NetworkSymbol, NetworkSymbolExtended } from '@suite-common/wallet-config';
import type {
    Account,
    BaseCurrencyAmount,
    TokenAddress,
    TokenSymbol,
} from '@suite-common/wallet-types';
import type { Translate } from '@suite-native/intl';
import type { Address } from '@trezor/blockchain-link-types';

export type TradeableAsset = {
    symbol: NetworkSymbolExtended;
    contractAddress?: TokenAddress | undefined;
    cryptoId: CryptoId;
    networkId: string;
} & Omit<CoinInfo, 'symbol' | 'services'>;

export type MyAsset = {
    symbol: NetworkSymbol;
    name: string;
    balance: string;
    fiatBalance: BaseCurrencyAmount | null;
    tokenSymbol?: TokenSymbol | null;
    contract?: TokenAddress;
    cryptoId?: CryptoId;
    isEnabled: boolean;
};

export type MyAssetTradeable = Omit<MyAsset, 'isEnabled'> & { isEnabled: true };
export type MyAssetsDisabled = {
    count: number;
    name: 'non-tradeable-assets';
    isEnabled: false;
};
export type MyAssetRow = MyAssetTradeable | MyAssetsDisabled;

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

export type FormWithSendAccountValues = {
    sendAsset: TradeableAsset | undefined;
    sendAccount: Account | undefined;
};

export type FormWithFiatCurrencyValues = {
    fiatCurrency: FiatCurrencyCode;
    amountInCrypto: boolean;
    country: TradingCountryOption;
    countrySubdivision?: TradingCountrySubdivisionOption;
};

export type QuotesCategory = 'fixed' | 'float' | 'dex';

export type QuotesByCategories<T extends TradingTradeType> = { [Q in QuotesCategory]?: T[] };

export type AbortablePromise<T = unknown> = Promise<T> & {
    abort: (message?: string) => void;
};

export type ConvertNumberToBaseUnit = (
    amount: number | undefined,
    symbol: NetworkSymbolExtended,
) => number | undefined;

export type TradingFormContext = Partial<TradingAmountLimitProps> & {
    translate: Translate;
    FiatAmountFormatter: Formatters['BaseCurrencyAmountFormatter'];
    CryptoAmountFormatter: Formatters['CryptoAmountFormatter'];
    convertNumberToBaseUnit: ConvertNumberToBaseUnit;
    sendSymbol: string | undefined;
    balance: string | undefined;
    networkReserve?: string;
};

export type ProviderConfirmationStatus =
    | 'inactive'
    | 'window_opened'
    | 'window_closed_incomplete'
    | 'window_closed_with_success'
    | 'confirmation_success'
    | 'confirmation_failed';
