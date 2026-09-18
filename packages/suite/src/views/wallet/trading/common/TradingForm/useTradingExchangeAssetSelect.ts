import { useCallback } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    TRADING_FORM_CRYPTO_TOKEN,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_AMOUNT_FIELDS,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_PROVIDER_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetSellOption,
    type TradingExchangeAmountLimitProps,
    type TradingExchangeFormProps,
    tradingActions,
} from '@suite-common/trading';
import { useCurrentRef } from '@trezor/react-utils';

import { type TradingFormInputBuyAssetProps } from './TradingFormInput/TradingFormInputBuyAsset/TradingFormInputBuyAsset';
import { type TradingFormInputSellAssetProps } from './TradingFormInput/TradingFormInputSellAsset/TradingFormInputSellAsset';

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

            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });

            await onCryptoCurrencyChangeRef.current(asset);
        },
        [onCryptoCurrencyChangeRef, getValuesRef, setValueRef],
    );

    const handleReceiveAssetSelect = useCallback<TradingFormInputBuyAssetProps['onAssetSelect']>(
        asset => {
            const sendCryptoSelect = getValuesRef.current(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);

            if (sendCryptoSelect?.id === asset.id) {
                setValueRef.current(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT, undefined, {
                    shouldDirty: true,
                });
                setValueRef.current(TRADING_FORM_CRYPTO_TOKEN, null, { shouldDirty: true });
                setValueRef.current(TRADING_FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
                setValueRef.current(TRADING_FORM_OUTPUT_FIAT, '', { shouldDirty: true });
                setValueRef.current(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
            }

            setValueRef.current(TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, asset, {
                shouldDirty: true,
            });
            clearErrorsRef.current(TRADING_FORM_OUTPUT_AMOUNT_FIELDS);
            setAmountLimitsRef.current(undefined);
            dispatch(tradingActions.setModalCryptoCurrency(asset.id));
            setValueRef.current(TRADING_FORM_PROVIDER_SELECT, undefined, { shouldDirty: true });
        },
        [dispatch, setAmountLimitsRef, getValuesRef, setValueRef, clearErrorsRef],
    );

    return { handleSellAssetSelect, handleReceiveAssetSelect };
};
