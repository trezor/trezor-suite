import { useEffect, useMemo, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { isTranslationKey, useTranslation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    TRADING_EXCHANGE_FROM_ADDRESS,
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_OUTPUT_AMOUNT,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    tradingActions,
} from '@suite-common/trading';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import {
    selectAccounts,
    selectAddressDisplayType,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { AddressDisplayOptions, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
import type { PROTO } from '@trezor/connect';
import { getSerializedPath } from '@trezor/connect/src/utils/pathUtils';

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

    useEffect(() => {
        if (!composedLevels) return;

        const formValues = getValues();
        const { setMaxOutputId } = formValues;
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
            if (type === 'exchange' && account.networkType === 'bitcoin') {
                const btcComposed = composed as PrecomposedTransaction;
                if ('inputs' in btcComposed && btcComposed.inputs) {
                    const addresses = Array.from(
                        new Set(
                            btcComposed.inputs
                                .map((i: PROTO.TxInputType) => {
                                    if (!i.address_n) return undefined;
                                    const path = getSerializedPath(i.address_n);

                                    return account.utxo?.find(u => u.path === path)?.address;
                                })
                                .filter(Boolean),
                        ),
                    );

                    const fromAddress = addresses.join(';');
                    if (fromAddress) {
                        // TODO: change to array of addresses
                        setValue(TRADING_EXCHANGE_FROM_ADDRESS, fromAddress, { shouldDirty: true });
                    }
                }
            }

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
        account.symbol,
        account.networkType,
        account.utxo,
        type,
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
