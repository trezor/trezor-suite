import { redactNumericalSubstring } from '@suite-common/discreet-mode';
import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import { type NetworkSymbol, isNetworkSymbol, networks } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import {
    type AmountSubunit,
    type AmountUnit,
    asAmountUnit,
    localizeNumber,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';
import { prepareDisplaySymbolFormatter } from './prepareDisplaySymbolFormatter';

export type CryptoAmountFormatterInputValue = string;

export type CryptoAmountFormatterDataContext = {
    symbol: NetworkSymbol | TokenSymbol;
    withSymbol?: boolean;
    isBalance?: boolean; // This enables the display in Sats if selected in settings // Todo: fix WTF naming
    maxDisplayedDecimals?: number;
    isEllipsisAppended?: boolean;
    smallestUnitsOverride?: boolean;
};

export const BASE_CRYPTO_MAX_DISPLAYED_DECIMALS = 8;

const DEFAULT_LOCALE: Locale = 'en-US';

const isLocale = (value: string): value is Locale => Object.hasOwn(LANGUAGES, value);

export const prepareCryptoAmountFormatterFast = (config: FormatterConfig) => {
    // Hoisted out of the per-call hot path — these depend only on config.
    const safeLocale: Locale = isLocale(config.locale) ? config.locale : DEFAULT_LOCALE;
    const isInSatoshis = config.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
    const displaySymbolFormatter = prepareDisplaySymbolFormatter(config);

    return makeFormatter<CryptoAmountFormatterInputValue, string, CryptoAmountFormatterDataContext>(
        (value, formatterContext, shouldRedactNumbers) => {
            const {
                symbol,
                withSymbol = true,
                isBalance = false,
                maxDisplayedDecimals = BASE_CRYPTO_MAX_DISPLAYED_DECIMALS,
                isEllipsisAppended = true,
                smallestUnitsOverride,
            } = formatterContext;

            const symbolIsNetwork = symbol !== undefined && isNetworkSymbol(symbol);
            const network = symbolIsNetwork ? networks[symbol] : undefined;
            const decimals = network?.decimals ?? 0;
            const features = network?.features as readonly string[] | undefined;
            const areAmountUnitsSupported = symbolIsNetwork
                ? !!features?.includes('amount-unit')
                : undefined;

            let amount: AmountUnit | AmountSubunit = asAmountUnit(new BigNumber(value));

            if (smallestUnitsOverride !== false) {
                if (
                    smallestUnitsOverride === true ||
                    (isBalance && areAmountUnitsSupported && isInSatoshis)
                ) {
                    amount = unitsToSubunits({
                        value: amount as AmountUnit,
                        decimals,
                        symbol: symbolIsNetwork ? symbol : undefined,
                    });
                } else if (!isBalance && (!isInSatoshis || !areAmountUnitsSupported)) {
                    amount = subunitsToUnits({
                        value: amount as unknown as AmountSubunit,
                        decimals,
                    });
                }
            }

            const formattedValue = localizeNumber(amount, safeLocale, 0, maxDisplayedDecimals);
            const wasResultRounded = (amount.decimalPlaces() ?? 0) > maxDisplayedDecimals;

            const ellipsizedValue =
                wasResultRounded && isEllipsisAppended ? `${formattedValue}…` : formattedValue;

            let result: string;
            if (withSymbol) {
                const formattedSymbol = symbolIsNetwork
                    ? displaySymbolFormatter.format(symbol, {
                          areAmountUnitsEnabled: smallestUnitsOverride,
                      })
                    : symbol;
                result = `${ellipsizedValue} ${formattedSymbol}`;
            } else {
                result = ellipsizedValue;
            }

            return shouldRedactNumbers ? redactNumericalSubstring(result) : result;
        },
        'CryptoAmountFormatter',
    );
};
