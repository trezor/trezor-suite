import { useEffect, useState } from 'react';

import { openDeferredModal } from '@suite/modal';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import {
    type FiatRatesResult,
    type Output,
    type Rate,
    type RatesByKey,
    type Timestamp,
} from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    fromBaseCurrencyToCryptoUnit,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode, baseCurrencies } from '@trezor/blockchain-link-types';

import { useDispatch } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type UseSendFormState } from 'src/types/wallet/sendForm';

type useSendFormImportProps = {
    network: UseSendFormState['network'];
    tokens: UseSendFormState['account']['tokens'];
    localCurrencyOption: UseSendFormState['localCurrencyOption'];
    fiatRate?: Rate;
    currentRates?: RatesByKey;
};

// This hook should be used only as a sub-hook of `useSendForm`
export const useSendFormImport = ({
    network,
    tokens,
    localCurrencyOption,
    currentRates,
}: useSendFormImportProps) => {
    const dispatch = useDispatch();
    const { shouldSendInSats } = useBitcoinAmountUnit(network.symbol);

    const importTransaction = async () => {
        // open ImportTransactionModal and get parsed csv
        const result = await dispatch(openDeferredModal({ type: 'import-transaction' }));
        if (!result || result.length < 1) return; // cancelled

        const rates: { currency: string; rate?: number }[] = [];

        if (result.some(it => !Object.prototype.hasOwnProperty.call(it, 'currency'))) {
            dispatch(notificationsActions.addToast({ type: 'could-not-parse-csv' }));

            return;
        }

        const currencies = result.map(it => it.currency.toLowerCase());
        const uniqueCurrencies = [...new Set(currencies)];

        for (const currency of uniqueCurrencies) {
            const fiatRateKey = getFiatRateKey(network.symbol, currency as BaseCurrencyCode);
            const fiatRate = currentRates?.[fiatRateKey];

            if (fiatRate) {
                rates.push({ currency, rate: fiatRate?.rate });
            } else {
                // fetch fiat rate for new currencies in the csv
                const updateFiatRatesResult = await dispatch(
                    updateFiatRatesThunk({
                        tickers: [
                            {
                                symbol: network.symbol,
                            },
                        ],
                        baseCurrencyCode: currency as BaseCurrencyCode,
                        rateType: 'current',
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                );

                if (updateFiatRatesResult.meta.requestStatus === 'fulfilled') {
                    const fiatRate = updateFiatRatesResult.payload as FiatRatesResult;

                    rates.push({ currency, rate: fiatRate?.rate });
                }
            }
        }

        const outputs = result.map(item => {
            // create default Output with address from csv
            const output: Output = {
                ...DEFAULT_PAYMENT,
                currency: localCurrencyOption,
                address: item.address || '',
            };

            if (item.label) {
                output.label = item.label;
            }

            // sanitize csv data
            const itemCurrency = item.currency.toLowerCase() as BaseCurrencyCode;

            // currency is specified in csv
            if (itemCurrency) {
                const itemRate = rates.find(r => r.currency === itemCurrency)?.rate;

                if (itemCurrency === network.symbol) {
                    // csv amount in crypto currency
                    const cryptoAmount = item.amount || '';
                    if (shouldSendInSats) {
                        // try to convert to satoshis
                        output.amount = convertAmountUnitsToSubunits(
                            cryptoAmount,
                            network.decimals,
                        );
                    } else {
                        output.amount = cryptoAmount;
                    }

                    const fiatRateKey = getFiatRateKey(network.symbol, localCurrencyOption.value);
                    const fiatRate = currentRates?.[fiatRateKey];

                    // calculate Fiat from Amount
                    if (fiatRate?.rate) {
                        const cryptoValue = shouldSendInSats
                            ? convertAmountSubunitsToUnits(output.amount, network.decimals)
                            : output.amount;
                        output.fiat =
                            toFiatCurrency({
                                amount: cryptoValue,
                                rate: fiatRate.rate,
                            })?.toFixed(2) || '';
                    }
                } else if (
                    Object.keys(baseCurrencies).find(currency => currency === itemCurrency) &&
                    itemRate
                ) {
                    // csv amount in fiat currency
                    output.currency = { value: itemCurrency, label: itemCurrency.toUpperCase() };
                    output.fiat = item.amount || '';

                    // calculate Amount from Fiat
                    const cryptoValue = fromBaseCurrencyToCryptoUnit({
                        fiatAmount: output.fiat,
                        rate: itemRate,
                    })?.toFixed(network.decimals);

                    const cryptoAmount =
                        cryptoValue && shouldSendInSats
                            ? convertAmountUnitsToSubunits(cryptoValue, network.decimals)
                            : (cryptoValue ?? '');

                    output.amount = cryptoAmount;
                } else if (tokens) {
                    // csv amount in ERC20 currency
                    const token = tokens.find(
                        t => t.symbol?.toLowerCase() === itemCurrency.toLowerCase(),
                    );
                    if (token) {
                        output.token = token.contract;
                        output.amount = item.amount || '';
                    }
                }

                if (!output.amount || (!output.fiat && network.testnet === false)) {
                    dispatch(notificationsActions.addToastOnce({ type: 'could-not-parse-csv' }));
                }
            }

            return output;
        });

        // only one output allowed for ETH and XRP
        // TODO: create queue of transactions to sign to allow multiple outputs for ETH/XRP (overkill?)
        return network.networkType === 'bitcoin' ? outputs : [outputs[0]];
    };

    // successful importTransaction resets the form
    // wait for data population (rerender) and trigger form validation
    const [trigger, setTriggerFn] = useState<(() => Promise<void>) | undefined>(undefined);
    useEffect(() => {
        if (trigger) {
            trigger();
        }
    }, [trigger]);

    const validateImportedTransaction = (triggerFn: () => Promise<void>) => {
        setTriggerFn(() => triggerFn);
    };

    return {
        importTransaction,
        validateImportedTransaction,
    };
};
