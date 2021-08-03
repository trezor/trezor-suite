import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { isChanged } from '@suite-utils/comparisonUtils';
import useDebounce from 'react-use/lib/useDebounce';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { BuyTradeQuoteRequest } from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import * as routerActions from '@suite-actions/routerActions';
import { getAmountLimits, processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import {
    FormState,
    Props,
    AmountLimits,
    BuyFormContextValues,
} from '@wallet-types/coinmarketBuyForm';
import { useFormDraft } from '@wallet-hooks/useFormDraft';
import { useCoinmarketBuyFormDefaultValues } from './useCoinmarketBuyFormDefaultValues';

export const BuyFormContext = createContext<BuyFormContextValues | null>(null);
BuyFormContext.displayName = 'CoinmarketBuyContext';

export const useCoinmarketBuyForm = (props: Props): BuyFormContextValues => {
    const {
        saveQuoteRequest,
        saveQuotes,
        saveCachedAccountInfo,
        saveTrade,
        goto,
        loadInvityData,
    } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveQuotes: coinmarketBuyActions.saveQuotes,
        saveCachedAccountInfo: coinmarketBuyActions.saveCachedAccountInfo,
        saveTrade: coinmarketBuyActions.saveTrade,
        goto: routerActions.goto,
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    loadInvityData();
    const { selectedAccount } = props;
    const { account, network } = selectedAccount;
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const { saveDraft, getDraft, removeDraft } = useFormDraft<FormState>('coinmarket-buy');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { buyInfo } = useSelector(state => ({ buyInfo: state.wallet.coinmarket.buy.buyInfo }));
    const { defaultValues, defaultCountry, defaultCurrency } = useCoinmarketBuyFormDefaultValues(
        account.symbol,
        buyInfo,
    );
    const methods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, errors, reset } = methods;
    const values = useWatch<FormState>({ control });

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, defaultValues, isDraft]);

    const resetForm = useCallback(() => {
        reset({});
        removeDraft(account.key);
    }, [account.key, removeDraft, reset]);

    useDebounce(
        () => {
            if (formState.isDirty && !formState.isValidating && Object.keys(errors).length === 0) {
                saveDraft(account.key, values as FormState);
            }
        },
        200,
        [errors, saveDraft, account.key, values, formState],
    );
    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    const onSubmit = async () => {
        const formValues = methods.getValues();
        const fiatStringAmount = formValues.fiatInput;
        const cryptoStringAmount = formValues.cryptoInput;
        const wantCrypto = !fiatStringAmount;
        const request: BuyTradeQuoteRequest = {
            wantCrypto,
            fiatCurrency: formValues.currencySelect.value.toUpperCase(),
            receiveCurrency: formValues.cryptoSelect.value,
            country: formValues.countrySelect.value,
            fiatStringAmount,
            cryptoStringAmount,
        };
        await saveQuoteRequest(request);
        await saveCachedAccountInfo(account.symbol, account.index, account.accountType);
        const allQuotes = await invityAPI.getBuyQuotes(request);
        const [quotes, alternativeQuotes] = processQuotes(allQuotes);
        const limits = getAmountLimits(request, quotes);

        if (limits) {
            setAmountLimits(limits);
        } else {
            await saveQuotes(quotes, alternativeQuotes);
            goto('wallet-coinmarket-buy-offers', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            });
        }
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);
    const isLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders =
        !isLoading &&
        (buyInfo?.buyInfo?.providers.length === 0 ||
            !buyInfo?.supportedCryptoCurrencies.has(account.symbol));

    return {
        ...methods,
        account,
        onSubmit,
        defaultCountry,
        defaultCurrency,
        register: typedRegister,
        buyInfo,
        saveQuotes,
        saveTrade,
        amountLimits,
        setAmountLimits,
        isLoading,
        noProviders,
        network,
        cryptoInputValue: values.cryptoInput,
        removeDraft,
        formState,
        isDraft,
        handleClearFormButtonClick: resetForm,
    };
};

export const useCoinmarketBuyFormContext = () => {
    const context = useContext(BuyFormContext);
    if (context === null) throw Error('BuyFormContext used without Context');
    return context;
};
