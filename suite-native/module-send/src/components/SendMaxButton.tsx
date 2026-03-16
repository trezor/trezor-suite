import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    selectAreSatsAmountUnit,
    selectBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { HStack, Switch, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';
import { calculateFeeLevelsMaxAmountThunk } from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useUtxoSelection } from '../hooks/useUtxoSelection';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { constructFormDraft, getOutputFieldName } from '../utils';

type SendMaxButtonProps = {
    outputIndex: number;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const SendMaxButton = ({ outputIndex, accountKey, tokenContract }: SendMaxButtonProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { selectedUtxos } = useUtxoSelection(accountKey);

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const decimals = symbol && getNetwork(symbol).decimals;

    const isBtcAmountInSats = useSelector(selectAreSatsAmountUnit);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const decimalsForBaseCurrency = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBtcAmountInSats,
    });

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );

    const [maxAmountValue, setMaxAmountValue] = useState<string | null>();

    const converters = useCryptoFiatConverters({ symbol, tokenContract });
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();

    const formValues = watch();

    const isMainnetSendMaxAvailable = !tokenContract && formValues.outputs.length === 1;
    const isSendMaxAvailable = tokenContract || isMainnetSendMaxAvailable;

    const isSendMaxEnabled = formValues.setMaxOutputId === outputIndex;

    const calculateFeeLevelsMaxAmount = useCallback(async () => {
        const response = await debounce(() =>
            dispatch(
                calculateFeeLevelsMaxAmountThunk({
                    formState: constructFormDraft({ formValues, selectedUtxos }),
                    accountKey,
                }),
            ),
        );

        if (isFulfilled(response)) {
            const { payload } = response;
            const value = payload.normal ?? payload.low; // If not enough balance for normal fee level, use low.
            setMaxAmountValue(value);
        }
    }, [dispatch, accountKey, debounce, formValues, selectedUtxos]);

    useEffect(() => {
        if (tokenBalance) setMaxAmountValue(tokenBalance);
        else if (isMainnetSendMaxAvailable) calculateFeeLevelsMaxAmount();
        else setMaxAmountValue(undefined);
    }, [isMainnetSendMaxAvailable, calculateFeeLevelsMaxAmount, tokenBalance]);

    const enableSendMax = () => {
        if (!maxAmountValue) return;

        setValue('setMaxOutputId', outputIndex);

        setValue(getOutputFieldName(outputIndex, 'amount'), maxAmountValue, {
            shouldValidate: true,
            shouldTouch: true,
        });

        const fiatValue = converters?.convertCryptoToFiat(new BigNumber(maxAmountValue));
        if (fiatValue && decimals !== null) {
            setValue(
                getOutputFieldName(outputIndex, 'fiat'),
                fiatValue?.toFixed(decimalsForBaseCurrency),
            );
        }
    };

    const disableSendMax = () => {
        setValue('setMaxOutputId', undefined);

        setValue(getOutputFieldName(outputIndex, 'amount'), '', {
            shouldValidate: true,
            shouldTouch: true,
        });

        setValue(getOutputFieldName(outputIndex, 'fiat'), '', {
            shouldValidate: true,
            shouldTouch: true,
        });
    };

    const toggleSendMax = (isToggled: boolean) => {
        Keyboard.dismiss();

        if (isToggled) {
            enableSendMax();
        } else {
            disableSendMax();
        }
    };

    return (
        isSendMaxAvailable &&
        maxAmountValue && (
            <Animated.View entering={FadeIn}>
                <HStack alignItems="center" spacing="sp8">
                    <Text variant="body-sm">
                        <Translation id="moduleSend.outputs.recipients.maxButton" />
                    </Text>

                    <Switch isChecked={isSendMaxEnabled} onChange={toggleSendMax} />
                </HStack>
            </Animated.View>
        )
    );
};
