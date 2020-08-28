import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { DEFAULT_PAYMENT, DEFAULT_OPTIONS, DEFAULT_VALUES } from '@wallet-constants/sendForm';
import {
    UseSendFormProps,
    UseSendFormState,
    FormState,
    SendContextValues,
    Output,
} from '@wallet-types/sendForm';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { useSendFormOutputs } from './useSendFormOutputs';
import { useSendFormFields } from './useSendFormFields';
import { useSendFormCompose } from './useSendFormCompose';

export const SendContext = createContext<SendContextValues | null>(null);
SendContext.displayName = 'SendContext';

const getDefaultValues = (currency: Output['currency']) => {
    return {
        ...DEFAULT_VALUES,
        options: [...DEFAULT_OPTIONS],
        outputs: [{ ...DEFAULT_PAYMENT, currency }],
    };
};

// convert UseSendFormProps to UseSendFormState
const getStateFromProps = (props: UseSendFormProps) => {
    const { account, network } = props.selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = props.fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = props.fiat.coins.find(item => item.symbol === symbol);
    const localCurrencyOption = {
        value: props.localCurrency,
        label: props.localCurrency.toUpperCase(),
    };
    return {
        account,
        network,
        coinFees,
        feeInfo,
        feeOutdated: false,
        fiatRates,
        localCurrencyOption,
        isLoading: false,
        online: props.online,
    };
};

// Mounted in top level index: @wallet-views/send
// returned ContextState is a object provided as SendContext values with custom callbacks for updating/resetting state
export const useSendForm = (props: UseSendFormProps): SendContextValues => {
    // public variables, exported to SendFormContext
    const [state, setState] = useState<UseSendFormState>(getStateFromProps(props));

    // private variables, used inside sendForm hook
    const draft = useRef<FormState | undefined>(undefined);
    const { getDraft, saveDraft, removeDraft, getLastUsedFeeLevel, signTransaction } = useActions({
        getDraft: sendFormActions.getDraft,
        saveDraft: sendFormActions.saveDraft,
        removeDraft: sendFormActions.removeDraft,
        getLastUsedFeeLevel: walletSettingsActions.getLastUsedFeeLevel,
        signTransaction: sendFormActions.signTransaction,
    });

    const { localCurrencyOption } = state;

    // register `react-hook-form`, default values are set later in "loadDraft" useEffect block
    const useFormMethods = useForm<FormState>({ mode: 'onChange' });

    const { control, reset, register, getValues } = useFormMethods;

    // register array fields (outputs array in react-hook-form)
    const outputsFieldArray = useFieldArray<Output>({
        control,
        name: 'outputs',
    });

    // load draft from reducer
    useEffect(() => {
        const storedState = getDraft();
        const lastUsedFee = getLastUsedFeeLevel();
        const feeEnhancement: Partial<FormState> = {};
        if (!storedState && lastUsedFee) {
            feeEnhancement.selectedFee = lastUsedFee.label;
            if (lastUsedFee.label === 'custom') {
                feeEnhancement.feePerUnit = lastUsedFee.feePerUnit;
                feeEnhancement.feeLimit = lastUsedFee.feeLimit;
            }
        }
        const values = {
            ...getDefaultValues(localCurrencyOption),
            ...storedState,
            ...feeEnhancement,
        };
        reset(values);

        if (storedState) {
            draft.current = storedState;
        }
    }, [localCurrencyOption, getDraft, getLastUsedFeeLevel, getValues, reset]);

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'setMaxOutputId', type: 'custom' });
        register({ name: 'selectedFee', type: 'custom' });
        register({ name: 'options', type: 'custom' });
    }, [register]);

    // update custom values
    const updateContext = useCallback(
        (value: Partial<UseSendFormState>) => {
            setState({
                ...state,
                ...value,
            });
            console.warn('updateContext', value, state);
        },
        [state],
    );

    const sendFormUtils = useSendFormFields({
        ...useFormMethods,
        fiatRates: state.fiatRates,
    });

    const {
        composeDraft,
        draftSaveRequest,
        setDraftSaveRequest,
        composeRequest,
        composedLevels,
        setComposedLevels,
    } = useSendFormCompose({
        ...useFormMethods,
        state,
        updateContext,
        setAmount: sendFormUtils.setAmount,
    });

    const sendFormOutputs = useSendFormOutputs({
        ...useFormMethods,
        outputsFieldArray,
        localCurrencyOption,
        composeRequest,
    });

    const resetContext = useCallback(() => {
        setComposedLevels(undefined);
        removeDraft();
        setState(getStateFromProps(props)); // resetting state will trigger "load draft" hook which will reset FormState
    }, [props, removeDraft, setComposedLevels]);

    // handle draft change
    useEffect(() => {
        if (!draft.current) return;
        composeDraft(draft.current);
        draft.current = undefined;
    }, [draft, composeDraft]);

    useEffect(() => {
        if (!draftSaveRequest) return;
        saveDraft(getValues());
        setDraftSaveRequest(false);
    }, [draftSaveRequest, setDraftSaveRequest, saveDraft, getValues]);

    const sign = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            const result = await signTransaction(values, composedTx);
            if (result) {
                resetContext();
            }
        }
    }, [getValues, composedLevels, signTransaction, resetContext]);

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...state,
        ...useFormMethods,
        register: typedRegister,
        outputs: outputsFieldArray.fields,
        composedLevels,
        updateContext,
        resetContext,
        composeTransaction: composeRequest,
        signTransaction: sign,
        ...sendFormUtils,
        ...sendFormOutputs,
    };
};

// Used across send form components
// Provide combined context of `react-hook-form` with custom values as SendContextValues
export const useSendFormContext = () => {
    const ctx = useContext(SendContext);
    if (ctx === null) throw Error('useSendFormContext used without Context');
    return ctx;
};
