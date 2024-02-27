import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useDidUpdate } from '@trezor/react-utils';
import {
    getDraft,
    removeDraft,
    saveDraft,
    signTransaction,
} from 'src/actions/wallet/sendFormActions';
import {
    getLastUsedFeeLevel,
    setLastUsedFeeLevel,
} from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { fillSendForm } from 'src/actions/suite/protocolActions';
import { AppState } from 'src/types/suite';
import {
    CoinFiatRates,
    FormState,
    SendContextValues,
    UseSendFormState,
} from '@suite-common/wallet-types';
import {
    getFeeLevels,
    getDefaultValues,
    amountToSatoshi,
    formatAmount,
} from '@suite-common/wallet-utils';
import { useSendFormOutputs } from './useSendFormOutputs';
import { useSendFormFields } from './useSendFormFields';
import { useSendFormCompose } from './useSendFormCompose';
import { useSendFormImport } from './useSendFormImport';
import { useFees } from './form/useFees';
import { PROTOCOL_TO_NETWORK } from 'src/constants/suite/protocol';
import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';
import { useUtxoSelection } from './form/useUtxoSelection';
import { useExcludedUtxos } from './form/useExcludedUtxos';

export const SendContext = createContext<SendContextValues | null>(null);
SendContext.displayName = 'SendContext';

// Props of @wallet-views/send/index
export interface SendFormProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    localCurrency: AppState['wallet']['settings']['localCurrency'];
    fees: AppState['wallet']['fees'];
    online: boolean;
    coins: CoinFiatRates[];
    sendRaw?: boolean;
    metadataEnabled: boolean;
    targetAnonymity?: number;
    prison?: Record<string, unknown>;
}
// Props of @wallet-hooks/useSendForm (selectedAccount should be loaded)
export interface UseSendFormProps extends SendFormProps {
    selectedAccount: Extract<SendFormProps['selectedAccount'], { status: 'loaded' }>;
}

// convert UseSendFormProps to UseSendFormState
const getStateFromProps = (props: UseSendFormProps) => {
    const { account, network } = props.selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = props.fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const localCurrencyOption = {
        value: props.localCurrency,
        label: props.localCurrency.toUpperCase(),
    };

    return {
        account,
        network,
        coinFees,
        feeInfo,
        localCurrencyOption,
        online: props.online,
        metadataEnabled: props.metadataEnabled,
    };
};

// Mounted in top level index: @wallet-views/send
// return SendContextValues used by SendFormContext in all nested children components of @wallet-views/send
// SendContextValues is a combination of `react-hook-form` methods with custom callbacks and utils
// see: ./packages/suite/docs/send/ARCHITECTURE.md

export const useSendForm = (props: UseSendFormProps): SendContextValues => {
    // public variables, exported to SendFormContext
    const [isLoading, setLoading] = useState(false);
    const fiatRates = props.coins.find(
        item => item.symbol === props.selectedAccount.account.symbol && !item.tokenAddress,
    );

    const [state, setState] = useState<UseSendFormState>(getStateFromProps(props));
    // private variables, used inside sendForm hook
    const draft = useRef<FormState | undefined>(undefined);

    const dispatch = useDispatch();

    const { localCurrencyOption } = state;

    // register `react-hook-form`, defaultValues are set later in "loadDraft" useEffect block
    const useFormMethods = useForm<FormState>({
        mode: 'onChange',
    });

    const { control, reset, register, getValues, formState, setValue, trigger } = useFormMethods;

    // register array fields (outputs array in react-hook-form)
    const outputsFieldArray = useFieldArray({
        control,
        name: 'outputs',
    });

    // enhance DEFAULT_VALUES with last remembered FeeLevel and localCurrencyOption
    // used in "loadDraft" useEffect and "importTransaction" callback
    const getLoadedValues = useCallback(
        (loadedState?: Partial<FormState>) => {
            const feeEnhancement: Partial<FormState> = {};
            if (!loadedState || !loadedState.selectedFee) {
                const lastUsedFee = dispatch(getLastUsedFeeLevel());
                if (lastUsedFee) {
                    feeEnhancement.selectedFee = lastUsedFee.label;
                    if (lastUsedFee.label === 'custom') {
                        feeEnhancement.feePerUnit = lastUsedFee.feePerUnit;
                        feeEnhancement.feeLimit = lastUsedFee.feeLimit;
                    }
                }
            }
            return {
                ...getDefaultValues(localCurrencyOption, state.network),
                ...loadedState,
                ...feeEnhancement,
            };
        },
        [dispatch, localCurrencyOption, state.network],
    );

    // update custom values
    const updateContext = useCallback(
        (value: Partial<UseSendFormState>) => {
            setState({
                ...state,
                ...value,
            });
        },
        [state],
    );

    const excludedUtxos = useExcludedUtxos({
        account: state.account,
        dustLimit: state.coinFees.dustLimit,
        targetAnonymity: props.targetAnonymity,
    });

    // declare sendFormUtils, sub-hook of useSendForm
    const sendFormUtils = useSendFormFields({
        ...useFormMethods,
        fiatRates,
        network: state.network,
    });

    // declare sendFormCompose, sub-hook of useSendForm
    const {
        composeDraft,
        draftSaveRequest,
        setDraftSaveRequest,
        composeRequest,
        composedLevels,
        setComposedLevels,
        onFeeLevelChange,
    } = useSendFormCompose({
        ...useFormMethods,
        state,
        account: props.selectedAccount.account,
        prison: props.prison,
        excludedUtxos,
        updateContext,
        setLoading,
        setAmount: sendFormUtils.setAmount,
    });

    // declare useSendFormOutputs, sub-hook of useSendForm
    const sendFormOutputs = useSendFormOutputs({
        ...useFormMethods,
        outputsFieldArray,
        localCurrencyOption,
        composeRequest,
    });

    // sub-hook
    const { changeFeeLevel } = useFees({
        defaultValue: undefined,
        feeInfo: state.feeInfo,
        saveLastUsedFee: true,
        onChange: onFeeLevelChange,
        composedLevels,
        composeRequest,
        ...useFormMethods,
    });

    // sub-hook
    const utxoSelection = useUtxoSelection({
        account: state.account,
        composedLevels,
        composeRequest,
        excludedUtxos,
        ...useFormMethods,
    });

    const { shouldSendInSats } = useBitcoinAmountUnit(props.selectedAccount.account.symbol);

    const resetContext = useCallback(() => {
        setComposedLevels(undefined);
        dispatch(removeDraft()); // reset draft
        dispatch(setLastUsedFeeLevel()); // reset last known FeeLevel
        setState(getStateFromProps(props)); // resetting state will trigger "loadDraft" useEffect block, which will reset FormState to default
    }, [dispatch, props, setComposedLevels]);

    // declare useSendFormImport, sub-hook of useSendForm
    const { importTransaction, validateImportedTransaction } = useSendFormImport({
        network: state.network,
        tokens: state.account.tokens,
        fiatRates,
        localCurrencyOption,
    });

    const loadTransaction = async () => {
        const outputs = await importTransaction();
        if (!outputs) return; // ignore empty result (cancelled or error)
        setComposedLevels(undefined);
        const values = getLoadedValues({ outputs });
        // keepDefaultValues will set `isDirty` flag to true
        reset(values, { keepDefaultValues: true });
        setLoading(false);
        validateImportedTransaction(async () => {
            const valid = await trigger();
            if (valid) {
                composeRequest();
            }
        });
    };

    // get response from TransactionReviewModal
    const sign = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            setLoading(true);
            const result = await dispatch(signTransaction(values, composedTx));
            setLoading(false);
            if (result?.success) {
                resetContext();
                dispatch(goto('wallet-index', { preserveParams: true }));
            }
        }
    }, [getValues, composedLevels, dispatch, resetContext]);

    // reset on account change
    useEffect(() => {
        if (state.account.key !== props.selectedAccount.account.key) {
            resetContext();
        }
    }, [props, resetContext, state.account]);

    const protocol = useSelector(state => state.protocol);

    // fill form using data from URI protocol handler e.g. 'bitcoin:address?amount=0.01'
    useEffect(() => {
        if (
            protocol.sendForm.shouldFill &&
            protocol.sendForm.scheme &&
            props.selectedAccount.network.symbol === PROTOCOL_TO_NETWORK[protocol.sendForm.scheme]
        ) {
            // for now we always fill only first output
            const outputIndex = 0;

            if (protocol.sendForm.amount) {
                const protocolAmount = protocol.sendForm.amount.toString();

                const formattedAmount = shouldSendInSats
                    ? amountToSatoshi(protocolAmount, state.network.decimals)
                    : protocolAmount;

                sendFormUtils.setAmount(outputIndex, formattedAmount);
            }
            if (protocol.sendForm.address) {
                setValue(`outputs.${outputIndex}.address`, protocol.sendForm.address, {
                    shouldValidate: true,
                });
            }
            dispatch(fillSendForm(false));
            composeRequest();
        }
    }, [
        dispatch,
        setValue,
        props.selectedAccount.network,
        protocol,
        sendFormUtils,
        composeRequest,
        shouldSendInSats,
        state.network.decimals,
    ]);

    // load draft from reducer
    useEffect(() => {
        const storedState = dispatch(getDraft());
        const values = getLoadedValues(storedState);
        // keepDefaultValues will set `isDirty` flag to true
        reset(values, { keepDefaultValues: !!storedState });

        if (storedState) {
            draft.current = storedState;
        }
    }, [dispatch, getLoadedValues, reset]);

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register('setMaxOutputId', { shouldUnregister: true });
        register('options', { shouldUnregister: true });
    }, [register]);

    // handle draft change
    useEffect(() => {
        if (!draft.current) return;
        composeDraft(draft.current);
        draft.current = undefined;
    }, [draft, composeDraft]);

    // handle draftSaveRequest
    useEffect(() => {
        if (!draftSaveRequest) return;
        if (Object.keys(formState.errors).length === 0) {
            dispatch(saveDraft(getValues()));
        }
        setDraftSaveRequest(false);
    }, [dispatch, draftSaveRequest, setDraftSaveRequest, getValues, formState.errors]);

    useDidUpdate(() => {
        const { outputs } = getValues();

        const conversionToUse = shouldSendInSats ? amountToSatoshi : formatAmount;

        outputs.forEach((output, index) => {
            if (!output.amount) {
                return;
            }

            sendFormUtils.setAmount(index, conversionToUse(output.amount, state.network.decimals));
        });

        composeRequest();
    }, [shouldSendInSats]);

    return {
        ...state,
        ...useFormMethods,
        isLoading,
        register,
        fiatRates,
        outputs: outputsFieldArray.fields,
        composedLevels,
        updateContext,
        resetContext,
        changeFeeLevel,
        composeTransaction: composeRequest,
        loadTransaction,
        signTransaction: sign,
        setDraftSaveRequest,
        utxoSelection,
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
