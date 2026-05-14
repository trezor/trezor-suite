import { useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { isTranslationKey, useTranslation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    TRADING_EXCHANGE_FROM_ADDRESS,
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_OUTPUT_AMOUNT,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    deriveBitcoinSwapFromAddresses,
    selectTradingInfo,
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
import {
    convertAmountSubunitsToUnits,
    getConvertedOrDefaultFeeInfo,
} from '@suite-common/wallet-utils';
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

import { useBitcoinAmountUnit } from '../../../useBitcoinAmountUnit';

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
    const tradingInfo = useSelector(selectTradingInfo);
    const btcSwapDummyData = tradingInfo?.config?.btcSwapDummyData;
    const { translationString } = useTranslation();
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

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
    const outputAmount = useWatch({ control, name: TRADING_FORM_OUTPUT_AMOUNT });
    const setMaxOutputId = useWatch({ control, name: 'setMaxOutputId' });
    const customFeePerUnit = useWatch({ control, name: 'feePerUnit' });
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

            // For BTC exchange swaps, the max amount is handled by the eager derivation effect below,
            // which accounts for swap-specific overhead (OP_RETURN + fee outputs)
            const isBtcExchangeSwap = type === 'exchange' && account.networkType === 'bitcoin';

            if (typeof setMaxOutputId === 'number' && composed.max && !isBtcExchangeSwap) {
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

    // Eagerly derive fromAddress and swap amount for Bitcoin exchange swaps.
    // This runs when the output amount changes, completing before the 500ms debounce
    // in useTradingFormActions fires handleChange, so the first quote request
    // already includes the correct fromAddress and swap-adjusted amount.
    const currentFeeLevel = selectedFee || 'normal';
    const feePerUnit =
        currentFeeLevel === 'custom'
            ? customFeePerUnit
            : feeInfo.levels.find(l => l.label === currentFeeLevel)?.feePerUnit;
    const prevFromAddressInputs = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (type !== 'exchange' || !account || !network || account.networkType !== 'bitcoin') {
            return;
        }
        if (!outputAmount && typeof setMaxOutputId !== 'number') {
            return;
        }

        const inputKey = `${outputAmount ?? ''}_${setMaxOutputId ?? ''}_${account.availableBalance}_${feePerUnit ?? ''}`;
        if (prevFromAddressInputs.current === inputKey) return;
        prevFromAddressInputs.current = inputKey;

        let cancelled = false;

        deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: outputAmount ?? '',
            decimals: network.decimals,
            setMaxOutputId,
            feePerUnit,
            btcSwapDummyData,
        }).then(result => {
            if (cancelled) return;

            if (result?.addresses) {
                const fromAddress = result.addresses.join(';');
                if (fromAddress) {
                    setValue(TRADING_EXCHANGE_FROM_ADDRESS, fromAddress, { shouldDirty: true });
                }
            }

            // For max amount swaps, update the amount to reflect the true maximum
            // after accounting for swap-specific outputs (OP_RETURN + fee outputs).
            if (typeof setMaxOutputId === 'number' && result?.amount) {
                const swapAmount = shouldSendInSats
                    ? result.amount
                    : convertAmountSubunitsToUnits(result.amount, network.decimals);

                // Pre-update the ref to the inputKey that will result from the new amount,
                // preventing the effect from re-running when setValue triggers a values change.
                prevFromAddressInputs.current = `${swapAmount}_${setMaxOutputId ?? ''}_${account.availableBalance}_${feePerUnit ?? ''}`;

                setValue(TRADING_FORM_OUTPUT_AMOUNT, swapAmount, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                clearErrors(TRADING_FORM_OUTPUT_AMOUNT);
            }
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        type,
        account?.networkType,
        account?.availableBalance,
        network,
        outputAmount,
        setMaxOutputId,
        shouldSendInSats,
        setValue,
        clearErrors,
        feePerUnit,
        btcSwapDummyData,
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
