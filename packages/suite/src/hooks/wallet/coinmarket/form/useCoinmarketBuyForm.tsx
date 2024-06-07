import { useCallback, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';
import type { BuyTradeQuoteRequest } from 'invity-api';

import { isChanged } from '@suite-common/suite-utils';
import { amountToSatoshi, formatAmount } from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';

import {
    clearQuotes,
    saveCachedAccountInfo,
    saveQuoteRequest,
    saveQuotes,
} from 'src/actions/wallet/coinmarketBuyActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { loadInvityData } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import invityAPI from 'src/services/suite/invityAPI';
import { getAmountLimits } from 'src/utils/wallet/coinmarket/buyUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { CRYPTO_INPUT } from 'src/types/wallet/coinmarketSellForm';
import { AmountLimits } from 'src/types/wallet/coinmarketCommonTypes';

import { useCoinmarketBuyFormDefaultValues } from './useCoinmarketBuyFormDefaultValues';
import { networkToCryptoSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketTradeBuyType, UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { processSellAndBuyQuotes } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useBitcoinAmountUnit } from '../../useBitcoinAmountUnit';
import {
    CoinmarketFormBuyFormContextProps,
    CoinmarketFormBuyFormProps,
} from 'src/types/coinmarket/coinmarketForm';

const useCoinmarketBuyForm = ({
    selectedAccount,
}: UseCoinmarketProps): CoinmarketFormBuyFormContextProps => {
    const buyInfo = useSelector(state => state.wallet.coinmarket.buy.buyInfo);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);

    const { account, network } = selectedAccount;
    const { navigateToBuyOffers } = useCoinmarketNavigation(account);
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const { saveDraft, getDraft, removeDraft } =
        useFormDraft<CoinmarketFormBuyFormProps>('coinmarket-buy');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { defaultValues, defaultCountry, defaultCurrency } = useCoinmarketBuyFormDefaultValues(
        account.symbol,
        buyInfo,
    );
    const methods = useForm<CoinmarketFormBuyFormProps>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, reset, setValue, getValues } = methods;
    const values = useWatch<CoinmarketFormBuyFormProps>({ control });

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && defaultValues) {
            reset(defaultValues);
        }
    }, [reset, defaultValues, isDraft]);

    useDidUpdate(() => {
        const cryptoInputValue = getValues(CRYPTO_INPUT);
        if (!cryptoInputValue) {
            return;
        }
        const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;
        setValue(CRYPTO_INPUT, conversion(cryptoInputValue, network.decimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);

    const resetForm = useCallback(() => {
        reset({});
        removeDraft(account.key);
    }, [account.key, removeDraft, reset]);

    useDebounce(
        () => {
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0
            ) {
                saveDraft(account.key, values as CoinmarketFormBuyFormProps);
            }
        },
        200,
        [
            formState.errors,
            formState.isDirty,
            formState.isValidating,
            saveDraft,
            account.key,
            values,
            shouldSendInSats,
        ],
    );
    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);

            return;
        }

        if (values.cryptoSelect && !values.cryptoSelect?.cryptoSymbol) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    const onSubmit = async () => {
        const formValues = methods.getValues();
        const fiatStringAmount = formValues.fiatInput;
        const cryptoStringAmount =
            formValues.cryptoInput && shouldSendInSats
                ? formatAmount(formValues.cryptoInput, network.decimals)
                : formValues.cryptoInput;
        const wantCrypto = !fiatStringAmount;
        const request: BuyTradeQuoteRequest = {
            wantCrypto,
            fiatCurrency: formValues.currencySelect.value.toUpperCase(),
            receiveCurrency: formValues.cryptoSelect.cryptoSymbol,
            country: formValues.countrySelect.value,
            fiatStringAmount,
            cryptoStringAmount,
        };
        dispatch(saveQuoteRequest(request));
        dispatch(saveCachedAccountInfo(account.symbol, account.index, account.accountType));
        const allQuotes = await invityAPI.getBuyQuotes(request);
        if (Array.isArray(allQuotes)) {
            const quotes = processSellAndBuyQuotes<CoinmarketTradeBuyType>(allQuotes);
            const limits = getAmountLimits(request, quotes);
            if (limits) {
                setAmountLimits(limits);
            } else {
                dispatch(saveQuotes(quotes));
                navigateToBuyOffers();
            }
        } else {
            dispatch(clearQuotes());
            navigateToBuyOffers();
        }
    };

    const isLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders =
        !isLoading &&
        (buyInfo?.buyInfo?.providers.length === 0 ||
            !(
                networkToCryptoSymbol(account.symbol) &&
                buyInfo?.supportedCryptoCurrencies.has(networkToCryptoSymbol(account.symbol)!)
            ));

    return {
        ...methods,
        account,
        onSubmit,
        defaultCountry,
        defaultCurrency,
        register,
        buyInfo,
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

export default useCoinmarketBuyForm;
