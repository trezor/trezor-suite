import { useState, useEffect, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isFulfilled } from '@reduxjs/toolkit';

import { useCryptoFiatConverters } from '@suite-native/formatters';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { useFormContext } from '@suite-native/forms';
import { useDebounce } from '@trezor/react-utils';
import { isAddressValid } from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';

import { calculateFeeLevelsMaxAmountThunk } from '../sendFormThunks';
import { getOutputFieldName, constructFormDraft } from '../utils';

type SendMaxButtonProps = {
    outputIndex: number;
    accountKey: AccountKey;
};

export const SendMaxButton = ({ outputIndex, accountKey }: SendMaxButtonProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const [maxAmountValue, setMaxAmountValue] = useState<string>();

    const converters = useCryptoFiatConverters({ networkSymbol: networkSymbol! });
    const { setValue, watch, trigger } = useFormContext();

    const formValues = watch() as FormState;
    const addressValue = formValues.outputs[outputIndex]?.address;

    const hasOutputValidAddress =
        addressValue && networkSymbol && isAddressValid(addressValue, networkSymbol);
    const isSendMaxAvailable = formValues.outputs.length === 1 && hasOutputValidAddress;

    const calculateFeeLevelsMaxAmount = useCallback(async () => {
        const response = await debounce(() =>
            dispatch(
                calculateFeeLevelsMaxAmountThunk({
                    formState: constructFormDraft(formValues as FormState),
                    accountKey,
                }),
            ),
        );

        if (isFulfilled(response)) {
            const { payload } = response;
            const value = payload.normal ?? payload.low; // If not enough balance for normal fee level, use low.
            setMaxAmountValue(value);
        }
    }, [dispatch, accountKey, debounce, formValues]);

    useEffect(() => {
        if (isSendMaxAvailable) calculateFeeLevelsMaxAmount();
        else setMaxAmountValue(undefined);
    }, [isSendMaxAvailable, calculateFeeLevelsMaxAmount]);

    const setOutputSendMax = () => {
        if (!maxAmountValue) return;

        Keyboard.dismiss();

        setValue('setMaxOutputId', outputIndex);
        setValue(getOutputFieldName(outputIndex, 'amount'), maxAmountValue);

        const fiatValue = converters?.convertCryptoToFiat(maxAmountValue);
        if (fiatValue) setValue(getOutputFieldName(outputIndex, 'fiat'), fiatValue);
        trigger();
    };

    return (
        isSendMaxAvailable && (
            <Animated.View entering={FadeIn}>
                <Button
                    size="small"
                    colorScheme="tertiaryElevation0"
                    onPress={setOutputSendMax}
                    isLoading={!maxAmountValue}
                >
                    <Translation id="moduleSend.outputs.recipients.maxButton" />
                </Button>
            </Animated.View>
        )
    );
};
