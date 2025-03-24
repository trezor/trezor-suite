import { useEffect, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { TradingExchangeFormProps } from '@suite-common/trading';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { getFeeInfo } from '@suite-common/wallet-utils';

import { saveComposedTransactionInfo } from 'src/actions/wallet/trading/tradingCommonActions';
import { FORM_OUTPUT_ADDRESS, FORM_OUTPUT_AMOUNT } from 'src/constants/wallet/trading/form';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useCompose } from 'src/hooks/wallet/form/useCompose';
import { useFees } from 'src/hooks/wallet/form/useFees';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import {
    TradingSellExchangeFormProps,
    TradingSellFormProps,
    TradingUseComposeTransactionProps,
    TradingUseComposeTransactionReturnProps,
    TradingUseComposeTransactionStateProps,
} from 'src/types/trading/tradingForm';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/trading/tradingUtils';

// shareable sub-hook used in useTradingSellForm & useTradingExchangeForm
export const useTradingComposeTransaction = <T extends TradingSellExchangeFormProps>({
    account,
    network,
    values,
    methods,
}: TradingUseComposeTransactionProps<T>): TradingUseComposeTransactionReturnProps => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const fees = useSelector(state => state.wallet.fees);
    const { translationString } = useTranslation();

    const { getValues, setValue, setError, clearErrors } = methods as unknown as UseFormReturn<
        TradingSellFormProps | TradingExchangeFormProps
    >;
    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;
    const { symbol, networkType } = account;
    const feeInfo = useMemo(
        () =>
            getFeeInfo({
                networkType,
                feeInfo: fees[symbol],
            }),
        [networkType, symbol, fees],
    );
    const initState = useMemo(() => ({ account, network, feeInfo }), [account, network, feeInfo]);
    const outputAddress = values?.outputs?.[0].address;
    const [state, setState] = useState<TradingUseComposeTransactionStateProps>(initState);

    // sub-hook, Composing transaction
    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
        setComposedLevels,
    } = useCompose({
        ...methods,
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
                setValue(FORM_OUTPUT_ADDRESS, address);
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
    ]);

    useEffect(() => {
        if (!composedLevels) return;

        const values = getValues();
        const { setMaxOutputId } = values;
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];

        if (!composed) return;

        if (composed.type === 'error' && composed.errorMessage) {
            setError(FORM_OUTPUT_AMOUNT, {
                type: COMPOSE_ERROR_TYPES.COMPOSE,
                message: translationString(composed.errorMessage.id, composed.errorMessage.values),
            });
        }

        if (composed.type === 'final' || composed.type === 'nonfinal') {
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(FORM_OUTPUT_AMOUNT, composed.max, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                clearErrors(FORM_OUTPUT_AMOUNT);
            }

            dispatch(saveComposedTransactionInfo({ selectedFee: selectedFeeLevel, composed }));
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [
        account.symbol,
        composedLevels,
        selectedFee,
        clearErrors,
        dispatch,
        getValues,
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
