import { useState, useEffect, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isFulfilled } from '@reduxjs/toolkit';

import { useCryptoFiatConverters } from '@suite-native/formatters';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Button } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useField, useFormContext } from '@suite-native/forms';
import { useDebounce } from '@trezor/react-utils';
import { Translation } from '@suite-native/intl';
import { selectAccountTokenBalance, TokensRootState } from '@suite-native/tokens';

import { calculateFeeLevelsMaxAmountThunk } from '../sendFormThunks';
import { getOutputFieldName, constructFormDraft } from '../utils';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';

type SendMaxButtonProps = {
    outputIndex: number;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const SendMaxButton = ({ outputIndex, accountKey, tokenContract }: SendMaxButtonProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );

    const { hasError: hasAddressError, isTouched: isAddressTouched } = useField({
        name: getOutputFieldName(outputIndex, 'address'),
    });

    const [maxAmountValue, setMaxAmountValue] = useState<string | null>();

    const converters = useCryptoFiatConverters({ networkSymbol: networkSymbol!, tokenContract });
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();

    const formValues = watch();

    const isAddressValid = isAddressTouched && !hasAddressError;

    const isMainnetSendMaxAvailable =
        !tokenContract && formValues.outputs.length === 1 && isAddressValid;
    const isSendMaxAvailable = tokenContract || isMainnetSendMaxAvailable;

    const calculateFeeLevelsMaxAmount = useCallback(async () => {
        const response = await debounce(() =>
            dispatch(
                calculateFeeLevelsMaxAmountThunk({
                    formState: constructFormDraft({ formValues }),
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
        if (tokenBalance) setMaxAmountValue(tokenBalance);
        else if (isMainnetSendMaxAvailable) calculateFeeLevelsMaxAmount();
        else setMaxAmountValue(undefined);
    }, [isMainnetSendMaxAvailable, calculateFeeLevelsMaxAmount, tokenBalance]);

    const setOutputSendMax = () => {
        if (!maxAmountValue) return;

        Keyboard.dismiss();

        setValue('setMaxOutputId', outputIndex);
        setValue(getOutputFieldName(outputIndex, 'amount'), maxAmountValue, {
            shouldValidate: true,
            shouldTouch: true,
        });

        const fiatValue = converters?.convertCryptoToFiat(maxAmountValue);
        if (fiatValue) setValue(getOutputFieldName(outputIndex, 'fiat'), fiatValue);
    };

    return (
        isSendMaxAvailable &&
        maxAmountValue && (
            <Animated.View entering={FadeIn}>
                <Button size="small" colorScheme="tertiaryElevation0" onPress={setOutputSendMax}>
                    <Translation id="moduleSend.outputs.recipients.maxButton" />
                </Button>
            </Animated.View>
        )
    );
};
