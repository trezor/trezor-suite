import * as sendFormActions from '@wallet-actions/sendFormActions';
import { useActions } from '@suite-hooks';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { FIAT } from '@suite-config';
import { fromFiatCurrency, toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { UseSendFormState, Output } from '@wallet-types/sendForm';

type Props = {
    network: UseSendFormState['network'];
    tokens: UseSendFormState['account']['tokens'];
    fiatRates: UseSendFormState['fiatRates'];
    localCurrencyOption: UseSendFormState['localCurrencyOption'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormImport = ({ network, tokens, localCurrencyOption, fiatRates }: Props) => {
    const { importRequest } = useActions({
        importRequest: sendFormActions.importRequest,
    });

    const importTransaction = async () => {
        // open ImportTransaction modal and get parsed csv
        const result = await importRequest();
        if (!result) return; // cancelled

        const outputs = result.map(item => {
            // create default Output with address from csv
            const output: Output = {
                ...DEFAULT_PAYMENT,
                currency: localCurrencyOption,
                address: item.address || '',
            };

            // currency is specified in csv
            if (item.currency) {
                // sanitize csv data
                const currency = item.currency.toLowerCase();

                if (currency === network.symbol) {
                    // csv amount in crypto currency
                    output.amount = item.amount || '';
                    // calculate Fiat from Amount
                    if (fiatRates && fiatRates.current) {
                        output.fiat =
                            toFiatCurrency(
                                output.amount,
                                output.currency.value,
                                fiatRates.current.rates,
                            ) || '';
                    }
                } else if (
                    FIAT.currencies.find(c => c === currency) &&
                    fiatRates &&
                    fiatRates.current &&
                    Object.keys(fiatRates.current.rates).includes(currency)
                ) {
                    // csv amount in fiat currency
                    output.currency = { value: currency, label: currency.toUpperCase() };
                    output.fiat = item.amount || '';
                    // calculate Amount from Fiat
                    output.amount =
                        fromFiatCurrency(
                            output.fiat,
                            currency,
                            fiatRates.current.rates,
                            network.decimals,
                        ) || '';
                } else if (tokens) {
                    // csv amount in ERC20 currency
                    const token = tokens.find(t => t.symbol === currency);
                    if (token) {
                        output.token = token.address;
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

    return {
        importTransaction,
    };
};
