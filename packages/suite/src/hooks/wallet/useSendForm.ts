import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { goto } from '@suite/router';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { useExcludedUtxos } from '@suite-common/transaction-search';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { FormState } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    getConvertedOrDefaultFeeInfo,
    getDefaultValues,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { useDidUpdate } from '@trezor/react-utils';

import { fillSendForm, resetProtocol } from 'src/actions/suite/protocolActions';
import {
    getSendFormDraftThunk,
    removeSendFormDraftThunk,
    saveSendFormDraftThunk,
    signAndPushSendFormTransactionThunk,
} from 'src/actions/wallet/send/sendFormThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { AppState } from 'src/types/suite';
import { SendContextValues, UseSendFormState } from 'src/types/wallet/sendForm';

import { useFees } from './form/useFees';
import { useUtxoSelection } from './form/useUtxoSelection';
import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';
import { useSendFormChangeHandlers } from './useSendFormChangeHandlers';
import { useSendFormCompose } from './useSendFormCompose';
import { useSendFormFields } from './useSendFormFields';
import { useSendFormImport } from './useSendFormImport';
import { useSendFormOutputs } from './useSendFormOutputs';

export const SendContext = createContext<SendContextValues | null>(null);
SendContext.displayName = 'SendContext';

// Props of @wallet-views/send/index
export interface SendFormProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    localCurrency: BaseCurrencyCode;
    fees: AppState['wallet']['fees'];
    online: boolean;
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
const getStateFromProps = (
    props: Pick<
        UseSendFormProps,
        'selectedAccount' | 'localCurrency' | 'online' | 'metadataEnabled'
    >,
) => {
    const { account, network } = props.selectedAccount;
    const currencyCode = props.localCurrency;
    const localCurrencyOption = {
        value: currencyCode,
        label: currencyCode as Uppercase<typeof currencyCode>,
    };

    return {
        account,
        network,
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
    const { selectedAccount, localCurrency, online, metadataEnabled } = props;

    // public variables, exported to SendFormContext
    const [isLoading, setLoading] = useState(false);

    const [state, setState] = useState<UseSendFormState>(
        getStateFromProps({ selectedAccount, localCurrency, online, metadataEnabled }),
    );

    const [showReserveBanner, setShowReserveBanner] = useState<boolean>(false);

    // private variables, used inside sendForm hook
    const draft = useRef<FormState | undefined>(undefined);

    const dispatch = useDispatch();

    const { localCurrencyOption } = state;

    const { symbol, networkType } = state.account;
    const rawFeeInfo = props.fees[symbol]?.data;
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({
                networkType,
                feeInfo: rawFeeInfo,
            }),
        [networkType, rawFeeInfo],
    );

    const useFormMethods = useForm<FormState>({
        mode: 'onChange',
        // !!! defaultValues are set later in "loadDraftValues" useEffect block
        defaultValues: {},
    });

    const { control, reset, register, getValues, formState, setValue, trigger } = useFormMethods;

    const currentRates = useSelector(selectCurrentFiatRates);

    // register array fields (outputs array in react-hook-form)
    const outputsFieldArray = useFieldArray({
        control,
        name: 'outputs',
    });

    // used in "loadDraft" useEffect and "importTransaction" callback
    const getLoadedValues = useCallback(
        (loadedState?: Partial<FormState>) => ({
            ...getDefaultValues(localCurrencyOption),
            ...loadedState,
        }),
        [localCurrencyOption],
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
        dustLimit: feeInfo.dustLimit,
        targetAnonymity: props.targetAnonymity,
    });

    // declare sendFormUtils, sub-hook of useSendForm
    const sendFormUtils = useSendFormFields({
        ...useFormMethods,
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
        feeInfo,
        account: props.selectedAccount.account,
        prison: props.prison,
        excludedUtxos,
        updateContext,
        setLoading,
        setAmount: sendFormUtils.setAmount,
        setShowReserveBanner,
    });

    const changeHandlers = useSendFormChangeHandlers({
        calculateCryptoAmountFromBaseCurrencyAmount:
            sendFormUtils.calculateCryptoAmountFromBaseCurrencyAmount,
        calculateBaseCurrencyAmountFromCryptoAmount:
            sendFormUtils.calculateBaseCurrencyAmountFromCryptoAmount,
        composeRequest,
        setValue,
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
        feeInfo,
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
        dispatch(removeSendFormDraftThunk());
        setState(getStateFromProps({ selectedAccount, localCurrency, online, metadataEnabled }));
    }, [dispatch, setComposedLevels, selectedAccount, localCurrency, online, metadataEnabled]);

    const resetDraft = useCallback(() => {
        dispatch(removeSendFormDraftThunk());
    }, [dispatch]);

    // declare useSendFormImport, sub-hook of useSendForm
    const { importTransaction, validateImportedTransaction } = useSendFormImport({
        network: state.network,
        tokens: state.account.tokens,
        localCurrencyOption,
        currentRates,
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
        const formState = getValues();
        const precomposedTransaction = composedLevels
            ? composedLevels[formState.selectedFee || 'normal']
            : undefined;
        if (precomposedTransaction?.type === 'final') {
            // sign workflow in Actions:
            // signSendFormTransactionThunk > sign[COIN]SendFormTransactionThunk > sendFormActions.storeSignedTransaction (modal with promise decision)
            setLoading(true);
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount: selectedAccount.account,
                }),
            ).unwrap();

            setLoading(false);
            if (result?.success) {
                resetContext();
                dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
            }
        }
    }, [getValues, composedLevels, dispatch, resetContext, selectedAccount.account]);

    const protocol = useSelector(state => state.protocol);

    // fill form using data from URI protocol handler e.g. 'bitcoin:address?amount=0.01'
    useEffect(() => {
        if (
            protocol.sendForm.shouldFill &&
            protocol.sendForm.scheme &&
            selectedAccount.network.symbol === getNetworkSymbolForProtocol(protocol.sendForm.scheme)
        ) {
            reset(getLoadedValues());
            // for now we always fill only first output
            const outputIndex = 0;

            if (protocol.sendForm.amount) {
                const protocolAmount = protocol.sendForm.amount.toString();

                const formattedAmount = shouldSendInSats
                    ? convertAmountUnitsToSubunits(protocolAmount, state.network.decimals)
                    : protocolAmount;

                sendFormUtils.setAmount(outputIndex, formattedAmount);
            }

            if (protocol.sendForm.address) {
                setValue(`outputs.${outputIndex}.address`, protocol.sendForm.address, {
                    shouldDirty: true,
                });

                // Defer validation until after Address component renders and registers validators
                setTimeout(() => {
                    trigger(`outputs.${outputIndex}.address`);
                }, 0);
            }

            dispatch(fillSendForm(false));
            dispatch(resetProtocol());
            composeRequest();
        }
    }, [
        dispatch,
        setValue,
        selectedAccount.network,
        protocol,
        sendFormUtils,
        composeRequest,
        shouldSendInSats,
        state.network.decimals,
        reset,
        getLoadedValues,
        trigger,
    ]);

    // load draft from reducer and reset current form values, this should be only called once on mount
    useEffect(() => {
        const loadDraftValues = async () => {
            const storedState = await dispatch(getSendFormDraftThunk()).unwrap();
            const values = getLoadedValues(storedState);

            reset(values, { keepDefaultValues: !!storedState });

            if (storedState) {
                draft.current = storedState;
                composeDraft(storedState);
            }
        };
        const shouldFillFromProtocol =
            protocol.sendForm.shouldFill &&
            protocol.sendForm.scheme &&
            protocol.sendForm.address &&
            selectedAccount.network.symbol ===
                getNetworkSymbolForProtocol(protocol.sendForm.scheme);

        if (!shouldFillFromProtocol) {
            loadDraftValues();
        }

        // composeDraft is excluded because its reference changes with each feeInfo update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // composeDraft is excluded because its reference changes with each feeInfo update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft]);

    // update composedLevels when feeInfo changes
    useEffect(() => {
        composeDraft(getValues());
    }, [composeDraft, getValues]);

    // handle draftSaveRequest
    useEffect(() => {
        if (!draftSaveRequest) return;
        if (Object.keys(formState.errors).length === 0) {
            dispatch(
                saveSendFormDraftThunk({ formState: { ...getValues(), selectedFee: undefined } }),
            );
        }
        setDraftSaveRequest(false);
    }, [dispatch, draftSaveRequest, setDraftSaveRequest, getValues, formState.errors]);

    useDidUpdate(() => {
        const { outputs } = getValues();

        const conversionToUse = shouldSendInSats
            ? convertAmountUnitsToSubunits
            : convertAmountSubunitsToUnits;

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
        methods: useFormMethods,
        feeInfo,
        isLoading,
        register,
        outputs: outputsFieldArray.fields,
        composedLevels,
        updateContext,
        resetContext,
        changeFeeLevel,
        composeTransaction: composeRequest,
        loadTransaction,
        signTransaction: sign,
        setDraftSaveRequest,
        resetDraft,
        utxoSelection,
        ...sendFormUtils,
        ...sendFormOutputs,
        ...changeHandlers,
        showReserveBanner,
        setShowReserveBanner,
    };
};

// Used across send form components
// Provide combined context of `react-hook-form` with custom values as SendContextValues
export const useSendFormContext = () => {
    const ctx = useContext(SendContext);
    if (ctx === null) throw Error('useSendFormContext used without Context');

    return ctx;
};
