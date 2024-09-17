import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { getFeeLevels } from '@suite-common/wallet-utils';
import { useEffect, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { saveComposedTransactionInfo } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { FORM_OUTPUT_ADDRESS, FORM_OUTPUT_AMOUNT } from 'src/constants/wallet/coinmarket/form';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useCompose } from 'src/hooks/wallet/form/useCompose';
import { useFees } from 'src/hooks/wallet/form/useFees';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import {
    CoinmarketExchangeFormProps,
    CoinmarketSellExchangeFormProps,
    CoinmarketSellFormProps,
    CoinmarketUseComposeTransactionProps,
    CoinmarketUseComposeTransactionReturnProps,
    CoinmarketUseComposeTransactionStateProps,
} from 'src/types/coinmarket/coinmarketForm';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/coinmarket/coinmarketUtils';

// shareable sub-hook used in useCoinmarketSellForm & useCoinmarketExchangeForm
export const useCoinmarketComposeTransaction = <T extends CoinmarketSellExchangeFormProps>({
    account,
    network,
    values,
    methods,
}: CoinmarketUseComposeTransactionProps<T>): CoinmarketUseComposeTransactionReturnProps => {
    const dispatch = useDispatch();
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectDevice);
    const addressDisplayType = useSelector(selectAddressDisplayType);
    const fees = useSelector(state => state.wallet.fees);
    const { translationString } = useTranslation();

    const { getValues, setValue, setError, clearErrors } = methods as unknown as UseFormReturn<
        CoinmarketSellFormProps | CoinmarketExchangeFormProps
    >;
    const chunkify = addressDisplayType === AddressDisplayOptions.CHUNKED;
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = useMemo(() => ({ ...coinFees, levels }), [coinFees, levels]);
    const initState = useMemo(() => ({ account, network, feeInfo }), [account, network, feeInfo]);
    const outputAddress = values?.outputs?.[0].address;
    const [state, setState] = useState<CoinmarketUseComposeTransactionStateProps>(initState);

    // sub-hook, Composing transaction
    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
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

        if (hasAccountChanged || (!outputAddress && account.symbol !== 'ada')) {
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

        if (
            composed.type === 'final' ||
            (composed.type === 'nonfinal' && account.symbol === 'ada')
        ) {
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
    };
};
