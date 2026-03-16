import { type JSX, type ReactElement } from 'react';

import type { FormatNumberOptions } from '@formatjs/intl';
import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '@suite-common/trading';
import {
    type RateTypeWithoutHistoric,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { SkeletonRectangle } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import type { UseFiatFromCryptoValueParams } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';

import { type HiddenPlaceholderProps } from './HiddenPlaceholder';

// Do NOT use any prop from <HiddenPlaceholderProps>, its here just to fix types
const SameWidthNums = styled.span<HiddenPlaceholderProps>`
    font-variant-numeric: tabular-nums;
`;

interface Params {
    value: JSX.Element | null;
    rate: JSX.Element | null;
    timestamp: number | null;
}

export type BaseCurrencyValueProps = UseFiatFromCryptoValueParams & {
    children?: (props: Params) => ReactElement | null;
    showApproximationIndicator?: boolean;
    disableHiddenPlaceholder?: boolean;
    fiatAmountFormatterOptions?: FormatNumberOptions;
    fiatRateFormatterOptions?: FormatNumberOptions;
    shouldConvert?: boolean;
    showLoadingSkeleton?: boolean;
    className?: string;
    isLoading?: boolean;
    rateType?: RateTypeWithoutHistoric;
};

/**
 * If used without children prop it returns a value of a crypto assets in fiat currency.
 * If prop `fiatCurrency` is not specified, the currency is read from suite settings.
 * null is returned if there was some problem with conversion (e.g., missing rates)
 *
 * If `symbol` is not NetworkSymbol (necessary to type forcing), it will handle that case as well.
 *
 * Advanced usage is with passing a function as a children's prop.
 * The function will be called (and rendered) with 1 object param: {fiatValue, fiatRateValue, fiatRateTimestamp}.
 *
 *  In case of a custom source of fiat rates returned timestamp is always null;
 * @param {BaseCurrencyValueProps} { amount, symbol, fiatCurrency, ...props }
 * @returns
 */
export const BaseCurrencyValue = ({
    children,
    amount, // expects a value in full units (BTC not sats)
    className,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    showApproximationIndicator,
    disableHiddenPlaceholder,
    fiatAmountFormatterOptions,
    fiatRateFormatterOptions,
    shouldConvert = true,
    showLoadingSkeleton,
    isLoading,
    rateType,
}: BaseCurrencyValueProps) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const isNativeToken = !tokenAddress || tokenAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;
    const { baseCurrencyCode, fiatAmount, rate, currentRate } = useFiatFromCryptoValue({
        amount,
        symbol,
        tokenAddress: isNativeToken ? undefined : tokenAddress,
        historicRate,
        useHistoricRate,
        rateType,
    });

    const { BaseCurrencyAmountFormatter } = useFormatters();

    // In case `shouldConvert === true` the `amount` is the Crypto-Value and will be converted.
    // However, in case `shouldConvert === false`, the `amount` is already converted BaseCurrency (Fiat) value.
    const value = shouldConvert ? fiatAmount : asBaseCurrencyAmount(new BigNumber(amount));

    const WrapperComponent = disableHiddenPlaceholder ? SameWidthNums : HiddenPlaceholder;

    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(state, symbol, tokenAddress || ('' as TokenAddress)),
    );

    const isZeroAmount = new BigNumber(amount ?? 0).isZero();

    const isLoadingSkeletonVisible =
        showLoadingSkeleton &&
        isTokenKnown &&
        !isZeroAmount &&
        !currentRate?.error &&
        (currentRate?.isLoading || isLoading);

    if (isLoadingSkeletonVisible) {
        return <SkeletonRectangle animate={shouldAnimate} />;
    }

    if (value) {
        const fiatValueComponent = (
            <WrapperComponent className={className}>
                {showApproximationIndicator && <>≈&nbsp;</>}
                <BaseCurrencyAmountFormatter
                    currency={baseCurrencyCode.toUpperCase()}
                    value={value}
                    {...fiatAmountFormatterOptions}
                />
            </WrapperComponent>
        );

        const fiatRateComponent = rate ? (
            <SameWidthNums>
                <BaseCurrencyAmountFormatter
                    currency={baseCurrencyCode}
                    value={asBaseCurrencyAmount(new BigNumber(rate))}
                    {...fiatRateFormatterOptions}
                />
            </SameWidthNums>
        ) : null;
        if (!children) return fiatValueComponent;

        return children({
            value: fiatValueComponent,
            rate: fiatRateComponent,
            timestamp: historicRate ? null : (currentRate?.lastTickerTimestamp ?? null),
        });
    }
    if (!children) return null;

    return children({ value: null, rate: null, timestamp: null });
};
