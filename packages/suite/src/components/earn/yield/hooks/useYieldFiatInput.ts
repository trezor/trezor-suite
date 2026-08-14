import { useCallback, useEffect, useMemo, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowFormValues,
    getTokenFiatRate,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { type YieldAmountCardFiatToggleProps } from '../common/YieldAmountCard';
import {
    getYieldCryptoInputValue,
    getYieldFiatInputValue,
    getYieldMaxFiatInputValue,
} from '../yieldFlowUtils';

export type YieldCurrency = 'crypto' | 'fiat';

type UseYieldFiatInputParams = {
    methods: UseFormReturn<YieldFlowFormValues>;
    // Symbol/token that prices the amount. `symbol` undefined (e.g. redeeming shares) disables fiat entry.
    symbol: NetworkSymbol | undefined;
    tokenAddress?: TokenAddress;
    decimals: number;
    vaultId?: string;
};

export type UseYieldFiatInputResult = {
    fiatToggle: YieldAmountCardFiatToggleProps | undefined;
    // Fills the exact crypto max and, in fiat mode, the rounded-down max fiat display, without
    // switching the active unit.
    setMaxAmount: (cryptoMax: string) => void;
    // Resets both fields to a crypto amount, filling the fiat display from the current rate.
    resetAmounts: (cryptoAmount: string) => void;
};

/**
 * Fiat/crypto entry for a yield amount form. `amountInput` stays the crypto source of truth; the
 * display-only `fiatInput` is kept in sync (crypto mode) and drives `amountInput` back (fiat mode).
 */
export const useYieldFiatInput = ({
    methods,
    symbol,
    tokenAddress,
    decimals,
    vaultId,
}: UseYieldFiatInputParams): UseYieldFiatInputResult => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const [currency, setCurrency] = useState<YieldCurrency>('crypto');

    const fiatSymbol = baseCurrencyCode.toUpperCase();

    const currentRate = useMemo(() => {
        if (!symbol) {
            return undefined;
        }

        return getTokenFiatRate(
            currentFiatRates,
            getFiatRateKey(symbol, baseCurrencyCode, tokenAddress),
        );
    }, [currentFiatRates, baseCurrencyCode, symbol, tokenAddress]);

    const hasFiatRate = currentRate !== undefined;

    const liveAmount = useWatch({ control: methods.control, name: 'amountInput' });

    // Keep the display-only fiat field in sync with the crypto source of truth. Runs only in crypto
    // mode so it never fights the user's fiat typing (onFiatAmountChange drives the reverse direction).
    useEffect(() => {
        if (currency !== 'crypto') {
            return;
        }

        const nextFiat = getYieldFiatInputValue({ amount: liveAmount, rate: currentRate });
        if (methods.getValues('fiatInput') !== nextFiat) {
            methods.setValue('fiatInput', nextFiat);
        }
    }, [currency, currentRate, liveAmount, methods]);

    // Fiat entry is impossible without a rate (e.g. redeeming shares); fall back to crypto.
    useEffect(() => {
        if (!hasFiatRate && currency === 'fiat') {
            setCurrency('crypto');
        }
    }, [currency, hasFiatRate]);

    const onFiatAmountChange = useCallback(
        (fiat: string) => {
            const crypto = getYieldCryptoInputValue({ fiat, rate: currentRate, decimals });
            methods.setValue('amountInput', crypto, { shouldValidate: true, shouldDirty: true });
        },
        [currentRate, decimals, methods],
    );

    // Derived from `currency` rather than the `setCurrency` updater, which React may invoke twice.
    const onToggle = useCallback(() => {
        const nextCurrency: YieldCurrency = currency === 'crypto' ? 'fiat' : 'crypto';

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'amount-currency-toggle',
                value: nextCurrency,
                networkSymbol: symbol,
                vaultId,
            },
        });

        setCurrency(nextCurrency);
    }, [analytics, currency, symbol, vaultId]);

    const fiatToggle: YieldAmountCardFiatToggleProps | undefined = hasFiatRate
        ? {
              currency,
              fiatSymbol,
              onToggle,
              onFiatAmountChange,
          }
        : undefined;

    const resetAmounts = useCallback(
        (cryptoAmount: string) => {
            methods.reset({
                amountInput: cryptoAmount,
                fiatInput: getYieldFiatInputValue({ amount: cryptoAmount, rate: currentRate }),
            });
        },
        [currentRate, methods],
    );

    const setMaxAmount = useCallback(
        (cryptoMax: string) => {
            methods.setValue('amountInput', cryptoMax, { shouldValidate: true, shouldDirty: true });

            // In fiat mode the crypto→fiat sync effect is disabled, so fill the fiat display here.
            if (currency === 'fiat') {
                methods.setValue(
                    'fiatInput',
                    getYieldMaxFiatInputValue({ amount: cryptoMax, rate: currentRate }),
                );
            }
        },
        [currency, currentRate, methods],
    );

    return { fiatToggle, setMaxAmount, resetAmounts };
};
