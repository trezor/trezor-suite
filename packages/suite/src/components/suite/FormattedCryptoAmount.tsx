import { useMemo } from 'react';

import { selectLanguage } from '@suite/settings';
import { isSignValuePositive } from '@suite-common/formatters';
import { type SignValue } from '@suite-common/suite-types';
import {
    type NetworkSymbolExtended,
    getDisplaySymbol,
    getNetworkOptional,
} from '@suite-common/wallet-config';
import { LOW_BALANCE_THRESHOLD } from '@suite-common/wallet-constants';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    type AmountUnit,
    formatCoinBalance,
    formatCoinBalanceByFiatRate,
    getFiatRateKey,
    localizeNumber,
    networkAmountToSmallestUnit,
} from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { Sign } from 'src/components/suite/Sign';
import { useSelector } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { RedactNumericalValue } from './RedactNumericalValue';

export interface FormattedCryptoAmountProps {
    value?: string | number | AmountUnit; // Todo: remove `string | number`, its for Back Compatibility only
    symbol?: NetworkSymbolExtended;
    contractAddress?: string | null;
    isBalance?: boolean;
    showApproximation?: boolean;
    signValue?: SignValue;
    signGrayscale?: boolean;
    disableHiddenPlaceholder?: boolean;
    /**
     * If true, the `FormattedCryptoAmount` expects the `HiddenPlaceholder` upstream (it provides the `RedactNumbersContext`), else an error is thrown.
     */
    isRawString?: boolean;
    isTabular?: boolean;
    'data-testid'?: string;
    className?: string;
}

export const FormattedCryptoAmount = ({
    value, // expects a value in full units (BTC not sats)
    symbol,
    contractAddress, // include contractAddress whenever the symbol is an token
    isBalance,
    showApproximation = false,
    signValue,
    signGrayscale,
    disableHiddenPlaceholder,
    isRawString,
    isTabular = true,
    className,
    'data-testid': dataTest,
}: FormattedCryptoAmountProps) => {
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const { areSatsDisplayed } = useBitcoinAmountUnit();

    const lowerCaseSymbol = symbol?.toLowerCase();
    const {
        features: networkFeatures,
        testnet: isTestnet,
        symbol: networkSymbol,
    } = getNetworkOptional(lowerCaseSymbol) ?? {};

    const currentRate = useSelector(state => {
        if (!networkSymbol) return undefined;
        const key = getFiatRateKey(
            networkSymbol,
            baseCurrencyCode,
            (contractAddress ?? undefined) as TokenAddress | undefined,
        );

        return selectFiatRatesByFiatRateKey(state, key);
    });

    const isAmountLow = useMemo(() => {
        if (!value || !showApproximation) return false;
        const valueBn = new BigNumber(value);

        return !valueBn.isZero() && valueBn.lt(LOW_BALANCE_THRESHOLD);
    }, [value, showApproximation]);

    if (!value) {
        return null;
    }

    const areSatsSupported = !!networkFeatures?.includes('amount-unit');

    let formattedValue = value;
    let formattedSymbol = symbol && getDisplaySymbol(symbol, contractAddress);

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    // convert to satoshis if needed
    if (isSatoshis && networkSymbol) {
        formattedValue = networkAmountToSmallestUnit(String(value), networkSymbol);

        formattedSymbol = isTestnet ? `sat ${formattedSymbol}` : 'sat';
    }

    // Dynamic decimals based on fiat rate — skipped in sats mode (already integer units).
    // Falls back to the existing formatters when no rate is available.
    const fiatRate = !isSatoshis ? currentRate?.rate : undefined;

    if (isAmountLow) {
        formattedValue = `< ${LOW_BALANCE_THRESHOLD}`;
    } else if (fiatRate !== undefined) {
        formattedValue = formatCoinBalanceByFiatRate(String(formattedValue), locale, fiatRate);
    } else if (isBalance) {
        formattedValue = formatCoinBalance(String(formattedValue), locale);
    } else {
        formattedValue = localizeNumber(formattedValue, locale);
    }

    // output as a string, mostly for compatibility with graphs
    if (isRawString) {
        const displayedSignValue = signValue ? `${isSignValuePositive(signValue) ? '+' : '-'}` : '';

        return (
            <>
                {displayedSignValue}
                {disableHiddenPlaceholder ? (
                    formattedValue
                ) : (
                    <RedactNumericalValue value={formattedValue} />
                )}{' '}
                {formattedSymbol}
            </>
        );
    }

    const renderedValue = disableHiddenPlaceholder ? (
        formattedValue
    ) : (
        <RedactNumericalValue value={formattedValue} />
    );

    const content = (
        <span data-testid={`${dataTest}-with-symbol`}>
            <span data-testid={dataTest}>
                {!!signValue && <Sign value={signValue} grayscale={signGrayscale} />}
                <Text isTabular={isTabular}>{renderedValue}</Text>
            </span>
            {formattedSymbol && (
                <>
                    {' '}
                    <BlurUrls text={formattedSymbol} />
                </>
            )}
        </span>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
