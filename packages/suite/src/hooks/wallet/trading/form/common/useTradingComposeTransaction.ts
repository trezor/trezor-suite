import { useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { isTranslationKey, useTranslation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_OUTPUT_AMOUNT,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    tradingActions,
} from '@suite-common/trading';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import {
    deriveTronColdRecipient,
    selectAccounts,
    selectAddressDisplayType,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useCompose } from 'src/hooks/wallet/form/useCompose';
import { useFees } from 'src/hooks/wallet/form/useFees';
import {
    type TradingSellExchangeFormProps,
    type TradingUseComposeTransactionProps,
    type TradingUseComposeTransactionReturnProps,
    type TradingUseComposeTransactionStateProps,
} from 'src/types/trading/tradingForm';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/trading/tradingUtils';

// shareable sub-hook used in useTradingSellForm & useTradingExchangeForm
export const useTradingComposeTransaction = <T extends TradingSellExchangeFormProps>({
    type,
    account,
    network,
    methods,
    setShowReserveBanner,
    shouldSuppressComposeErrors,
}: TradingUseComposeTransactionProps<T>): TradingUseComposeTransactionReturnProps => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const { translationString } = useTranslation();

    const { getValues, setValue, setError, clearErrors, control } =
        methods as unknown as UseFormReturn<TradingSellFormProps | TradingExchangeFormProps>;
    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;
    const symbol = account?.symbol;
    const networkType = account?.networkType;
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, symbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({
                networkType: networkType ?? 'bitcoin',
                feeInfo: rawFeeInfo,
            }),
        [networkType, rawFeeInfo],
    );
    const initState = useMemo(() => ({ account, network, feeInfo }), [account, network, feeInfo]);
    const outputAddress = useWatch({ control, name: TRADING_FORM_OUTPUT_ADDRESS });
    const [state, setState] = useState<TradingUseComposeTransactionStateProps>(initState);
    const replaceablePlaceholderRef = useRef<{ accountKey?: string; address?: string }>({});

    // Tron: derive a cold recipient for the offers fee estimate, passed via compose context.
    // Keyed on device?.state (not the device object) so signing doesn't re-fire the device call.
    const accountsRef = useRef(accounts);
    accountsRef.current = accounts;
    const deviceRef = useRef(device);
    deviceRef.current = device;
    const [feeEstimationRecipient, setFeeEstimationRecipient] = useState<string | undefined>(
        undefined,
    );

    useEffect(() => {
        if (networkType !== 'tron' || !account || !network) {
            setFeeEstimationRecipient(undefined);

            return;
        }
        let isMounted = true;
        deriveTronColdRecipient({
            account,
            network,
            accounts: accountsRef.current,
            device: deviceRef.current,
        }).then(recipient => {
            if (isMounted) setFeeEstimationRecipient(recipient);
        });

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        account?.descriptor,
        account?.symbol,
        account?.accountType,
        networkType,
        device?.state,
        network,
    ]);

    const composeContext = useMemo(() => {
        if (!state.account || !state.network) {
            return undefined;
        }

        return {
            account: state.account,
            network: state.network,
            feeInfo: state.feeInfo,
            feeEstimationRecipient,
        };
    }, [state, feeEstimationRecipient]);

    // sub-hook, Composing transaction
    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
        setComposedLevels,
    } = useCompose({
        ...methods,
        state: composeContext,
    });

    // sub-hook, FeeLevels handler
    const { changeFeeLevel, selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    useEffect(() => {
        let isMounted = true;

        if (!account || !network) {
            setState(initState);
            setComposedLevels(undefined);

            return;
        }

        const hasAccountChanged = !(
            state.account?.descriptor === initState.account?.descriptor &&
            state.account?.symbol === initState.account?.symbol
        );

        const accountKey =
            initState.account && `${initState.account.symbol}:${initState.account.descriptor}`;
        if (replaceablePlaceholderRef.current.accountKey !== accountKey) {
            replaceablePlaceholderRef.current = {
                accountKey,
                address: getValues('outputs')?.[0]?.address,
            };
        }

        const setStateAsync = async () => {
            const address: string = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );

            if (!isMounted) {
                return;
            }

            const currentOutput = getValues('outputs')?.[0];

            if (currentOutput && typeof address === 'string') {
                const isReplaceable =
                    currentOutput.address !== address &&
                    (!currentOutput.address ||
                        currentOutput.address === replaceablePlaceholderRef.current.address);
                if (isReplaceable) {
                    setValue(TRADING_FORM_OUTPUT_ADDRESS, address);
                }
                setState(initState);
            }
        };

        // update fee info only if the block height has increased.
        // note: This approach may not be ideal for Bitcoin, as fees can change within the same block
        const hasFeeInfoChanged = feeInfo.blockHeight - state.feeInfo.blockHeight > 0;

        if (
            hasAccountChanged ||
            (!outputAddress && account.symbol !== 'ada') ||
            hasFeeInfoChanged
        ) {
            setStateAsync();
        }

        return () => {
            isMounted = false;
        };
        // call effect only when listed dependencies will change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        account?.symbol,
        account?.descriptor,
        chunkify,
        device,
        network,
        state.account?.descriptor,
        state.account?.symbol,
        initState.account?.descriptor,
        initState.account?.symbol,
        initState.feeInfo,
        outputAddress,
        type,
    ]);

    useEffect(() => {
        if (!composedLevels) return;

        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];

        if (!composed) return;

        if (composed.type === 'error') {
            if (shouldSuppressComposeErrors) {
                clearErrors(TRADING_FORM_OUTPUT_AMOUNT);
            } else if (isTranslationKey(composed.errorMessage?.id)) {
                setError(TRADING_FORM_OUTPUT_AMOUNT, {
                    type: COMPOSE_ERROR_TYPES.COMPOSE,
                    message: translationString(
                        composed.errorMessage.id,
                        composed.errorMessage.values,
                    ),
                });
            }
        }

        if (composed.type === 'final' || composed.type === 'nonfinal') {
            const currentOutputAmount = values.outputs?.[0]?.amount;

            if (typeof setMaxOutputId === 'number' && composed.max) {
                const currentBN = new BigNumber(currentOutputAmount || '0');
                const composedMaxBN = new BigNumber(composed.max);

                if (!currentBN.isEqualTo(composedMaxBN)) {
                    setShowReserveBanner(true);
                    setValue(TRADING_FORM_OUTPUT_AMOUNT, composed.max, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
                clearErrors(TRADING_FORM_OUTPUT_AMOUNT);
            }

            dispatch(
                tradingActions.saveComposedTransactionInfo({
                    selectedFee: selectedFeeLevel,
                    composed,
                }),
            );

            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        account?.symbol,
        composedLevels,
        selectedFee,
        clearErrors,
        dispatch,
        getValues,
        setError,
        setValue,
        translationString,
        shouldSuppressComposeErrors,
    ]);

    return {
        ...state,
        isComposing,
        composedLevels,
        feeInfo,
        changeFeeLevel,
        composeRequest,
        setComposedLevels,
    };
};
