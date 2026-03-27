import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { isTranslationKey, useTranslation } from '@suite/intl';
import { selectAddressDisplayType } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import {
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_OUTPUT_AMOUNT,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    tradingActions,
} from '@suite-common/trading';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { selectAccounts, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

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
    values,
    methods,
    setShowReserveBanner,
    quoteAmount,
}: TradingUseComposeTransactionProps<T>): TradingUseComposeTransactionReturnProps => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const { translationString } = useTranslation();

    const { getValues, setValue, setError, clearErrors } = methods as unknown as UseFormReturn<
        TradingSellFormProps | TradingExchangeFormProps
    >;
    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;
    const { symbol, networkType } = account;
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, symbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({
                networkType,
                feeInfo: rawFeeInfo,
            }),
        [networkType, rawFeeInfo],
    );
    const initState = useMemo(() => ({ account, network, feeInfo }), [account, network, feeInfo]);
    const outputAddress = values?.outputs?.[0].address;
    const [state, setState] = useState<TradingUseComposeTransactionStateProps>(initState);
    const [shouldUpdateMaxAmount, setShouldUpdateMaxAmount] = useState(true);

    const patchedGetValues = useCallback(
        (...args: Parameters<typeof getValues>) => {
            if (args.length > 0) return getValues(...args);

            const formValues = getValues();

            if (!quoteAmount) return formValues;

            return {
                ...formValues,
                setMaxOutputId: undefined,
                outputs: formValues.outputs?.map((output, index) =>
                    index === 0 ? { ...output, amount: quoteAmount } : output,
                ),
            };
        },
        [getValues, quoteAmount],
    ) as typeof getValues;

    // sub-hook, Composing transaction
    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
        setComposedLevels,
    } = useCompose({
        ...methods,
        getValues: patchedGetValues as unknown as UseFormReturn<T>['getValues'],
        state,
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
        const setStateAsync = async () => {
            const address = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );

            if (values?.outputs?.[0] && typeof address === 'string') {
                if (!values.outputs[0].address) {
                    setValue(TRADING_FORM_OUTPUT_ADDRESS, address);
                }
                setState(initState);
            }
        };
        const hasAccountChanged = !(
            state.account.descriptor === initState.account.descriptor &&
            state.account.symbol === initState.account.symbol
        );

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
        // call effect only when listed dependencies will change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        account.symbol,
        account.descriptor,
        chunkify,
        device,
        network,
        state.account.descriptor,
        state.account.symbol,
        initState.account.descriptor,
        initState.account.symbol,
        initState.feeInfo,
        outputAddress,
        type,
    ]);

    const prevQuoteAmountRef = useRef(quoteAmount);

    useEffect(() => {
        if (quoteAmount !== prevQuoteAmountRef.current) {
            composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        }
        prevQuoteAmountRef.current = quoteAmount;
    }, [quoteAmount, composeRequest]);

    useEffect(() => {
        if (!composedLevels) return;

        const values = patchedGetValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];

        if (!composed) return;

        if (composed.type === 'error' && isTranslationKey(composed.errorMessage?.id)) {
            setError(TRADING_FORM_OUTPUT_AMOUNT, {
                type: COMPOSE_ERROR_TYPES.COMPOSE,
                message: translationString(composed.errorMessage.id, composed.errorMessage.values),
            });
        }

        if (composed.type === 'final' || composed.type === 'nonfinal') {
            if (
                !quoteAmount &&
                typeof setMaxOutputId === 'number' &&
                composed.max &&
                shouldUpdateMaxAmount
            ) {
                setShouldUpdateMaxAmount(false);
                setShowReserveBanner(true);
                setValue(TRADING_FORM_OUTPUT_AMOUNT, composed.max, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                clearErrors(TRADING_FORM_OUTPUT_AMOUNT);
            } else if (!quoteAmount) {
                setShouldUpdateMaxAmount(true);
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
        account.symbol,
        composedLevels,
        selectedFee,
        clearErrors,
        dispatch,
        patchedGetValues,
        quoteAmount,
        setError,
        setValue,
        translationString,
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
