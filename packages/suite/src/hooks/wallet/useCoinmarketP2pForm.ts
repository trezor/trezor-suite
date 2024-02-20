import { createContext, useCallback, useContext, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';

import { isChanged } from '@suite-common/suite-utils';

import {
    FormState,
    P2pFormContextValues,
    UseCoinmarketP2pFormProps,
} from 'src/types/wallet/coinmarketP2pForm';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { saveQuotes, saveQuotesRequest } from 'src/actions/wallet/coinmarketP2pActions';
import { loadInvityData } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { useCoinmarketP2pFormDefaultValues } from 'src/hooks/wallet/useCoinmarketP2pFormDefaultValues';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import invityAPI from 'src/services/suite/invityAPI';

export const P2pFormContext = createContext<P2pFormContextValues | null>(null);
P2pFormContext.displayName = 'CoinmarketP2pContext';

export const useCoinmarketP2pForm = ({
    selectedAccount,
}: UseCoinmarketP2pFormProps): P2pFormContextValues => {
    const p2pInfo = useSelector(state => state.wallet.coinmarket.p2p.p2pInfo);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);

    const { account } = selectedAccount;
    const { navigateToP2pOffers } = useCoinmarketNavigation(account);
    const { getDraft, saveDraft, removeDraft } = useFormDraft<FormState>('coinmarket-p2p');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { defaultValues, defaultCountry, defaultCurrency } =
        useCoinmarketP2pFormDefaultValues(p2pInfo);
    const methods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: isDraft ? draft : defaultValues,
    });

    const { register, control, formState, reset } = methods;
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
            if (
                formState.isDirty &&
                !formState.isValidating &&
                Object.keys(formState.errors).length === 0
            ) {
                saveDraft(account.key, values as FormState);
            }
        },
        200,
        [formState.errors, saveDraft, account.key, values, formState],
    );
    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(account.key);
        }
    }, [defaultValues, values, removeDraft, account.key]);

    const onSubmit = async () => {
        const formValues = methods.getValues();

        if (!formValues.fiatInput) {
            return;
        }

        const request = {
            assetCode: account.symbol.toUpperCase(),
            amount: formValues.fiatInput,
            currency: formValues.currencySelect.value.toUpperCase(),
            country: formValues.countrySelect.value,
        };
        dispatch(saveQuotesRequest(request));

        const response = await invityAPI.getP2pQuotes(request);
        dispatch(saveQuotes(response?.quotes || []));

        navigateToP2pOffers();
    };

    return {
        ...methods,
        register,
        account,
        defaultCountry,
        defaultCurrency,
        p2pInfo,
        isLoading: !p2pInfo,
        isDraft,
        handleClearFormButtonClick: resetForm,
        onSubmit,
    };
};

export const useCoinmarketP2pFormContext = () => {
    const context = useContext(P2pFormContext);
    if (context === null) throw Error('P2pFormContext used without Context');

    return context;
};
