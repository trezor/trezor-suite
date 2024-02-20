import { useState, useEffect } from 'react';

import { importRequest } from 'src/actions/wallet/sendFormActions';
import { useDispatch } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { fiatCurrencies } from '@suite-common/suite-config';
import {
    fromFiatCurrency,
    toFiatCurrency,
    amountToSatoshi,
    formatAmount,
} from '@suite-common/wallet-utils';
import { UseSendFormState, Output } from 'src/types/wallet/sendForm';
import { CoinFiatRates } from '@suite-common/wallet-types';

type Props = {
    network: UseSendFormState['network'];
    tokens: UseSendFormState['account']['tokens'];
    fiatRates?: CoinFiatRates;
    localCurrencyOption: UseSendFormState['localCurrencyOption'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormImport = ({ network, tokens, localCurrencyOption, fiatRates }: Props) => {
    const dispatch = useDispatch();
    const { shouldSendInSats } = useBitcoinAmountUnit(network.symbol);

    const importTransaction = async () => {
        // open ImportTransactionModal and get parsed csv
        const result = await dispatch(importRequest());
        if (!result || result.length < 1) return; // cancelled

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

            // currency is specified in csv
            if (item.currency) {
                // sanitize csv data
                const currency = item.currency.toLowerCase();

                if (currency === network.symbol) {
                    // csv amount in crypto currency
                    const cryptoAmount = item.amount || '';
                    if (shouldSendInSats) {
                        // try to convert to satoshis
                        output.amount = amountToSatoshi(cryptoAmount, network.decimals);
                    } else {
                        output.amount = cryptoAmount;
                    }

                    // calculate Fiat from Amount
                    if (fiatRates && fiatRates.current) {
                        const cryptoValue = shouldSendInSats
                            ? formatAmount(output.amount, network.decimals)
                            : output.amount;
                        output.fiat =
                            toFiatCurrency(
                                cryptoValue,
                                output.currency.value,
                                fiatRates.current.rates,
                            ) || '';
                    }
                } else if (
                    Object.keys(fiatCurrencies).find(c => c === currency) &&
                    fiatRates &&
                    fiatRates.current &&
                    Object.keys(fiatRates.current.rates).includes(currency)
                ) {
                    // csv amount in fiat currency
                    output.currency = { value: currency, label: currency.toUpperCase() };
                    output.fiat = item.amount || '';
                    // calculate Amount from Fiat
                    const cryptoValue = fromFiatCurrency(
                        output.fiat,
                        currency,
                        fiatRates.current.rates,
                        network.decimals,
                    );
                    const cryptoAmount =
                        cryptoValue && shouldSendInSats
                            ? amountToSatoshi(cryptoValue, network.decimals)
                            : cryptoValue ?? '';

                    output.amount = cryptoAmount;
                } else if (tokens) {
                    // csv amount in ERC20 currency
                    const token = tokens.find(t => t.symbol === currency);
                    if (token) {
                        output.token = token.contract;
                        output.amount = item.amount || '';
                    }
                }

                if (!output.amount || !output.fiat) {
                    // TODO: display Toast notification with invalid currency error?
                    // what if there will be multiple errors? Toast spamming...
                    console.warn('import error', currency, output);
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
