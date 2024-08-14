import { Network } from '@suite-common/wallet-config';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import { Account, AddressDisplayOptions, FeeInfo } from '@suite-common/wallet-types';
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
} from 'src/types/coinmarket/coinmarketForm';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/coinmarket/coinmarketUtils';

interface CoinmarketUseComposeTransactionProps<T extends CoinmarketSellExchangeFormProps> {
    account: Account;
    network: Network;
    values: T;
    methods: UseFormReturn<T>;
}

interface CoinmarketUseComposeTransactionStateProps {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
}

// shareable sub-hook used in useCoinmarketSellForm & useCoinmarketExchangeForm
export const useCoinmarketComposeTransaction = <T extends CoinmarketSellExchangeFormProps>({
    account,
    network,
    values,
    methods,
}: CoinmarketUseComposeTransactionProps<T>) => {
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
    const [isInitiatedComposingAddress, setIsInitiatedComposingAddress] = useState(false);
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
        const setStateAsync = async (initState: CoinmarketUseComposeTransactionStateProps) => {
            const address = await getComposeAddressPlaceholder(
                account,
                network,
                device,
                accounts,
                chunkify,
            );

            if (values?.outputs?.[0] && address) {
                setValue(FORM_OUTPUT_ADDRESS, address);
                setState(initState);
                setIsInitiatedComposingAddress(true);
            }
        };

        if (
            !(
                state.account.descriptor === initState.account.descriptor &&
                state.account.symbol === initState.account.symbol
            ) ||
            !isInitiatedComposingAddress
        ) {
            setStateAsync(initState);
        }
    }, [
        account,
        accounts,
        chunkify,
        device,
        initState,
        network,
        values?.outputs,
        isInitiatedComposingAddress,
        state.account.descriptor,
        state.account.symbol,
        setValue,
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

        if (composed.type === 'final') {
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
