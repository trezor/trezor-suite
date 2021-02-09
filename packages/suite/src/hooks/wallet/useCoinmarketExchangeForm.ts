import { createContext, useContext, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import TrezorConnect from 'trezor-connect';
import { ExchangeTradeQuoteRequest } from 'invity-api';
import BigNumber from 'bignumber.js';
import { NETWORKS } from '@wallet-config';
import { useActions } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import { invityApiSymbolToSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';
import { toFiatCurrency, fromFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { useInvityAPI } from '@wallet-hooks/useCoinmarket';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as routerActions from '@suite-actions/routerActions';
import {
    FormState,
    Props,
    ComposeData,
    AmountLimits,
    ExchangeFormContextValues,
} from '@wallet-types/coinmarketExchangeForm';
import { getAmountLimits, splitToFixedFloatQuotes } from '@wallet-utils/coinmarket/exchangeUtils';
import { useFees } from './form/useFees';

export const ExchangeFormContext = createContext<ExchangeFormContextValues | null>(null);
ExchangeFormContext.displayName = 'CoinmarketExchangeContext';

export const useCoinmarketExchangeForm = (props: Props): ExchangeFormContextValues => {
    const { exchangeInfo } = useInvityAPI();
    const {
        selectedAccount,
        quotesRequest,
        fees,
        fiat,
        localCurrency,
        exchangeCoinInfo,
        device,
    } = props;
    const { account, network } = selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };
    const methods = useForm<FormState>({
        mode: 'onChange',
        shouldUnregister: false, // NOTE: tracking custom fee inputs
        defaultValues: { selectedFee: 'normal', feePerUnit: '', feeLimit: '' },
    });
    const { register, setValue, getValues, setError, clearErrors } = methods;
    const [token, setToken] = useState<string | undefined>(getValues('sendCryptoSelect')?.value);
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const [isMax, setIsMax] = useState<boolean | undefined>(undefined);
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [transactionInfo, setTransactionInfo] = useState<null | PrecomposedTransactionFinal>(
        null,
    );
    const [storedPlaceholderAddress, setStoredPlaceholderAddress] = useState<string | undefined>();
    const {
        saveQuoteRequest,
        saveQuotes,
        saveTrade,
        composeTransaction,
        saveComposedTransaction,
        goto,
    } = useActions({
        saveQuoteRequest: coinmarketExchangeActions.saveQuoteRequest,
        saveQuotes: coinmarketExchangeActions.saveQuotes,
        saveTrade: coinmarketExchangeActions.saveTrade,
        composeTransaction: coinmarketCommonActions.composeTransaction,
        saveComposedTransaction: coinmarketCommonActions.saveComposedTransaction,
        goto: routerActions.goto,
    });

    const updateFiatValue = (amount: string) => {
        const currency: { value: string; label: string } | undefined = getValues('fiatSelect');
        if (!fiatRates || !fiatRates.current || !currency) return;
        const fiatValue = toFiatCurrency(amount, currency.value, fiatRates.current.rates);
        setValue('fiatInput', fiatValue || '', { shouldValidate: true });
    };

    const getComposeAddressPlaceholder = async () => {
        // the address is later replaced by the address of the exchange
        // as a precaution, use user's own address as a placeholder
        const { networkType } = account;
        switch (networkType) {
            case 'bitcoin': {
                // use legacy (the most expensive) address for fee calculation
                // as we do not know what address type the exchange will use
                const legacy =
                    NETWORKS.find(
                        network =>
                            network.symbol === account.symbol && network.accountType === 'legacy',
                    ) ||
                    NETWORKS.find(
                        network =>
                            network.symbol === account.symbol && network.accountType === 'segwit',
                    ) ||
                    network;
                if (legacy && device) {
                    const result = await TrezorConnect.getAddress({
                        device,
                        coin: legacy.symbol,
                        path: `${legacy.bip44.replace('i', '0')}/0/0`,
                        useEmptyPassphrase: device.useEmptyPassphrase,
                        showOnTrezor: false,
                    });
                    if (result.success) {
                        return result.payload.address;
                    }
                }
                // as a fallback, use the change address of current account
                return account.addresses?.change[0].address;
            }
            case 'ethereum':
            case 'ripple':
                return account.descriptor;
            // no default
        }
    };

    const compose = async (data: ComposeData) => {
        let ok = false;
        setIsComposing(true);
        const formValues = getValues();
        const token =
            data && data.token ? data.token : formValues.sendCryptoSelect.value || undefined;
        const feeLevel = feeInfo.levels.find(level => level.label === data.feeLevelLabel);
        const selectedFeeLevel =
            feeLevel || feeInfo.levels.find(level => level.label === formValues.selectedFee);
        if (!selectedFeeLevel) return false;

        let placeholderAddress = storedPlaceholderAddress;
        if (!placeholderAddress) {
            placeholderAddress = await getComposeAddressPlaceholder();
            setStoredPlaceholderAddress(placeholderAddress);
        }

        let { feePerUnit } = selectedFeeLevel;
        if (selectedFeeLevel.label === 'custom') {
            feePerUnit = data?.feePerUnit ? data.feePerUnit : formValues.feePerUnit || '0';
        }

        const result = await composeTransaction({
            account,
            amount: data && data.amount ? data.amount : formValues.sendCryptoInput || '0',
            feeInfo,
            feePerUnit,
            feeLimit: data && data.feeLimit ? data.feeLimit : formValues.feeLimit || '0',
            network,
            selectedFee: formValues.selectedFee,
            isMaxActive: data && data.setMax ? data.setMax || false : false,
            address: placeholderAddress,
            token: token ? token.toLowerCase() : undefined,
            isInvity: true,
        });

        const formattedToken = invityApiSymbolToSymbol(token);
        const tokenInfo = account.tokens?.find(t => t.symbol === formattedToken);
        const decimals = tokenInfo ? tokenInfo.decimals : network.decimals;

        const transactionInfo = result ? result[selectedFeeLevel.label] : null;
        if (transactionInfo?.type === 'final') {
            setTransactionInfo(transactionInfo);
            if (data.fillValue) {
                let amountToFill = data.amount || '0';
                if (data.setMax) {
                    amountToFill = new BigNumber(transactionInfo.max || '0')
                        .decimalPlaces(decimals)
                        .toFixed();
                }
                setValue('sendCryptoInput', amountToFill, { shouldValidate: true });
                updateFiatValue(amountToFill);
            }
            saveComposedTransaction(transactionInfo);
            clearErrors('sendCryptoInput');
            setValue('estimatedFeeLimit', transactionInfo.estimatedFeeLimit);
            ok = true;
        }

        if (transactionInfo?.type === 'error' && transactionInfo.errorMessage) {
            setError('sendCryptoInput', {
                type: 'compose',
                message: transactionInfo.errorMessage as any,
            });
        }

        setIsComposing(false);
        return ok;
    };

    const updateFiatCurrency = (currency: { label: string; value: string }) => {
        const amount = getValues('sendCryptoInput') || '0';
        if (!fiatRates || !fiatRates.current || !currency) return;
        const fiatValue = toFiatCurrency(amount, currency.value, fiatRates.current.rates);
        if (fiatValue) {
            setValue('fiatInput', fiatValue, { shouldValidate: true });
        }
    };

    const updateSendCryptoValue = (amount: string, decimals: number) => {
        const currency: { value: string; label: string } | undefined = getValues('fiatSelect');
        if (!fiatRates || !fiatRates.current || !currency) return;
        const cryptoValue = fromFiatCurrency(
            amount,
            currency.value,
            fiatRates.current.rates,
            decimals,
        );

        setValue('sendCryptoInput', cryptoValue || '', { shouldValidate: true });
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);
    const isLoading = !exchangeInfo?.exchangeList || exchangeInfo?.exchangeList.length === 0;
    const noProviders =
        exchangeInfo?.exchangeList?.length === 0 || !exchangeInfo?.sellSymbols.has(account.symbol);

    const onSubmit = async () => {
        const formValues = getValues();
        const sendStringAmount = formValues.sendCryptoInput || '';
        const send = formValues.sendCryptoSelect.value;
        const receive = formValues.receiveCryptoSelect.value;
        const request: ExchangeTradeQuoteRequest = {
            receive,
            send,
            sendStringAmount,
        };

        const ok = await compose({ setMax: isMax });
        if (ok) {
            saveQuoteRequest(request);
            const allQuotes = await invityAPI.getExchangeQuotes(request);
            const limits = getAmountLimits(allQuotes);

            if (limits) {
                setAmountLimits(limits);
            } else {
                const [fixedQuotes, floatQuotes] = splitToFixedFloatQuotes(allQuotes, exchangeInfo);
                saveQuotes(fixedQuotes, floatQuotes);
                goto('wallet-coinmarket-exchange-offers', {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                });
            }
        }
    };

    // compose is not a callback. i don't want to rewrite the whole hook because of this
    // there is a lot to improve with compose method, like debounce or work with all precomposed levels instead of one
    // automatic switch to first possible FeeLevel (like send form)
    const onFeeLevelChange = (_: any, current?: FormState['selectedFee']) => {
        compose({
            fillValue: isMax,
            setMax: isMax,
            feeLevelLabel: current,
        });
    };

    const composeRequest = (field?: string) => {
        const formValues = getValues();
        if (field === 'feePerUnit') {
            compose({
                fillValue: isMax,
                setMax: isMax,
                feePerUnit: formValues.feePerUnit,
            });
        }
        if (field === 'feeLimit') {
            compose({
                fillValue: isMax,
                setMax: isMax,
                feeLimit: formValues.feeLimit,
            });
        }
    };

    // sub-hook, FeeLevels handler
    const { changeFeeLevel } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    return {
        ...methods,
        account,
        onSubmit,
        updateFiatValue,
        register: typedRegister,
        exchangeInfo,
        isMax: isMax || false,
        changeFeeLevel,
        setToken,
        saveQuoteRequest,
        setMax: setIsMax,
        saveQuotes,
        quotesRequest,
        transactionInfo,
        localCurrencyOption,
        exchangeCoinInfo,
        updateFiatCurrency,
        token,
        updateSendCryptoValue,
        saveTrade,
        feeInfo,
        compose,
        fiatRates,
        isComposing,
        amountLimits,
        setAmountLimits,
        isLoading,
        noProviders,
        network,
        setIsComposing,
    };
};

export const useCoinmarketExchangeFormContext = () => {
    const context = useContext(ExchangeFormContext);
    if (context === null) throw Error('ExchangeFormContext used without Context');
    return context;
};
