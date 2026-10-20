import { useCallback } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import {
    TRADING_FORM_AMOUNT_INPUT_SOURCE,
    TRADING_FORM_AMOUNT_IN_CRYPTO,
    TRADING_FORM_CRYPTO_TOKEN,
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_AMOUNT_FIELDS,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_PROVIDER_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeAmountLimitProps,
    type TradingExchangeFormProps,
    tradingActions,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { useCurrentRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { type TradingFormInputBuyAssetProps } from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import { type TradingFormInputSellAssetProps } from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';

export type HandleAssetsSwitchParams = {
    receiveAccountKey?: AccountKey;
    payAmount?: string;
};

export type UseTradingExchangeAssetSelectParams = {
    methods: UseFormReturn<TradingExchangeFormProps>;
    onCryptoCurrencyChange: (asset: TradingAssetSellOption) => Promise<void>;
    setAmountLimits: (limits: TradingExchangeAmountLimitProps | undefined) => void;
};

export const useTradingExchangeAssetSelect = ({
    methods,
    onCryptoCurrencyChange,
    setAmountLimits,
}: UseTradingExchangeAssetSelectParams) => {
    const { dispatch } = useServices(injectDispatch);

    const { getValues, setValue, clearErrors } = methods;

    // `useTradingExchangeForm` has some re-rendering issues, use refs to avoid them
    const onCryptoCurrencyChangeRef = useCurrentRef(onCryptoCurrencyChange);
    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
    const getValuesRef = useCurrentRef(getValues);
    const setValueRef = useCurrentRef(setValue);
    const clearErrorsRef = useCurrentRef(clearErrors);

    const resetQuotes = useCallback(() => {
        setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        setValueRef.current('transactionData', '');
        setValueRef.current(TRADING_FORM_OUTPUT_ADDRESS, '');
        dispatch(tradingExchangeActions.clearQuotes());
    }, [dispatch, setValueRef]);

    const handleSellAssetSelect = useCallback<TradingFormInputSellAssetProps['onAssetSelect']>(
        async asset => {
            const receiveCryptoSelect = getValuesRef.current(
                TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
            );

            if (receiveCryptoSelect?.id === asset.id) {
                setValueRef.current(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, null, {
                    shouldDirty: true,
                });
            }

            resetQuotes();

            await onCryptoCurrencyChangeRef.current(asset);
        },
        [onCryptoCurrencyChangeRef, getValuesRef, setValueRef, resetQuotes],
    );

    const clearSendAsset = useCallback(() => {
        setValueRef.current(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT, undefined, {
            shouldDirty: true,
        });
        setValueRef.current(TRADING_FORM_CRYPTO_TOKEN, null, { shouldDirty: true });
        setValueRef.current(TRADING_FORM_OUTPUT_FIAT, '', { shouldDirty: true });
        setValueRef.current(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
    }, [setValueRef]);

    const selectReceiveAsset = useCallback(
        (asset: TradingAssetOption) => {
            setValueRef.current(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, asset, {
                shouldDirty: true,
            });
            clearErrorsRef.current(TRADING_FORM_OUTPUT_AMOUNT_FIELDS);
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        },
        [dispatch, setAmountLimitsRef, setValueRef, clearErrorsRef],
    );

    const handleReceiveAssetSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            const sendCryptoSelect = getValuesRef.current(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);

            if (sendCryptoSelect?.id === asset.id) {
                clearSendAsset();
            }

            selectReceiveAsset(asset);
        },
        [getValuesRef, clearSendAsset, selectReceiveAsset],
    );

    const handleAssetsSwitch = useCallback(
        ({ receiveAccountKey, payAmount }: HandleAssetsSwitchParams) => {
            const sendCryptoSelect = getValuesRef.current(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
            const receiveCryptoSelect = getValuesRef.current(
                TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
            );

            if (!sendCryptoSelect || !receiveCryptoSelect) {
                return;
            }

            const { accountKey: sendAccountKey, ...sendAsset } = sendCryptoSelect;

            dispatch(tradingExchangeActions.setReceiveAccountKey(sendAccountKey));
            selectReceiveAsset(sendAsset);

            if (!receiveAccountKey) {
                clearSendAsset();
                resetQuotes();

                return;
            }

            if (payAmount) {
                setValueRef.current(TRADING_FORM_OUTPUT_AMOUNT, payAmount, { shouldDirty: true });
                setValueRef.current(TRADING_FORM_AMOUNT_IN_CRYPTO, true, { shouldDirty: true });
                setValueRef.current(TRADING_FORM_AMOUNT_INPUT_SOURCE, 'crypto');
            }

            handleSellAssetSelect({ ...receiveCryptoSelect, accountKey: receiveAccountKey });
        },
        [
            dispatch,
            getValuesRef,
            setValueRef,
            selectReceiveAsset,
            clearSendAsset,
            resetQuotes,
            handleSellAssetSelect,
        ],
    );

    return { handleSellAssetSelect, handleReceiveAssetSelect, handleAssetsSwitch };
};
