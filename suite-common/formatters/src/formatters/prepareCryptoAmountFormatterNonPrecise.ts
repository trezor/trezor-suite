import { redactNumericalSubstring } from '@suite-common/discreet-mode';
import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import { type NetworkSymbol, isNetworkSymbol, networks } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';
import { prepareDisplaySymbolFormatter } from './prepareDisplaySymbolFormatter';

export type CryptoAmountFormatterInputValue = string;

export type CryptoAmountFormatterDataContext = {
    symbol: NetworkSymbol | TokenSymbol;
    withSymbol?: boolean;
    isBalance?: boolean;
    maxDisplayedDecimals?: number;
    isEllipsisAppended?: boolean;
    smallestUnitsOverride?: boolean;
};

export const BASE_CRYPTO_MAX_DISPLAYED_DECIMALS = 8;

const DEFAULT_LOCALE: Locale = 'en-US';

const isLocale = (value: string): value is Locale => Object.hasOwn(LANGUAGES, value);

const countDecimals = (n: number): number => {
    if (!Number.isFinite(n)) return 0;
    const s = Math.abs(n).toString();
    const eIdx = s.indexOf('e');
    if (eIdx >= 0) {
        const exp = parseInt(s.slice(eIdx + 1), 10);
        const dotIdx = s.indexOf('.');
        const mantissaDecimals = dotIdx >= 0 && dotIdx < eIdx ? eIdx - dotIdx - 1 : 0;

        return Math.max(0, mantissaDecimals - exp);
    }
    const dotIdx = s.indexOf('.');

    return dotIdx >= 0 ? s.length - dotIdx - 1 : 0;
};

export const prepareCryptoAmountFormatterNonPrecise = (config: FormatterConfig) => {
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

            let amount = parseFloat(value);

            if (smallestUnitsOverride !== false) {
                if (
                    smallestUnitsOverride === true ||
                    (isBalance && areAmountUnitsSupported && isInSatoshis)
                ) {
                    amount = amount * 10 ** decimals;
                } else if (!isBalance && (!isInSatoshis || !areAmountUnitsSupported)) {
                    amount = amount / 10 ** decimals;
                }
            }

            const formattedValue = amount.toLocaleString(safeLocale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: maxDisplayedDecimals,
            });
            const wasResultRounded = countDecimals(amount) > maxDisplayedDecimals;

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
        'CryptoAmountFormatterNonPrecise',
    );
};
