import { createContext, useCallback, useContext, useEffect } from 'react';
import {
    FormState,
    P2pFormContextValues,
    UseCoinmarketP2pFormProps,
} from 'src/types/wallet/coinmarketP2pForm';
import { useActions, useSelector } from 'src/hooks/suite';
import * as coinmarketP2pActions from 'src/actions/wallet/coinmarketP2pActions';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { useCoinmarketP2pFormDefaultValues } from 'src/hooks/wallet/useCoinmarketP2pFormDefaultValues';
import { useForm, useWatch } from 'react-hook-form';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import useDebounce from 'react-use/lib/useDebounce';
import { isChanged } from 'src/utils/suite/comparisonUtils';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import invityAPI from 'src/services/suite/invityAPI';
import { SuiteUseFormRegister } from '@suite-common/wallet-types';

export const P2pFormContext = createContext<P2pFormContextValues | null>(null);
P2pFormContext.displayName = 'CoinmarketP2pContext';

export const useCoinmarketP2pForm = (props: UseCoinmarketP2pFormProps): P2pFormContextValues => {
    const { loadInvityData, saveQuotesRequest, saveQuotes } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        saveQuotesRequest: coinmarketP2pActions.saveQuotesRequest,
        saveQuotes: coinmarketP2pActions.saveQuotes,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { selectedAccount } = props;
    const { account } = selectedAccount;
    const { navigateToP2pOffers } = useCoinmarketNavigation(account);
    const { getDraft, saveDraft, removeDraft } = useFormDraft<FormState>('coinmarket-p2p');
    const draft = getDraft(account.key);
    const isDraft = !!draft;

    const { p2pInfo } = useSelector(state => ({
        p2pInfo: state.wallet.coinmarket.p2p.p2pInfo,
    }));
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
        saveQuotesRequest(request);

        const response = await invityAPI.getP2pQuotes(request);
        saveQuotes(response?.quotes || []);

        navigateToP2pOffers();
    };

    return {
        ...methods,
        register: register as SuiteUseFormRegister<FormState>,
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
