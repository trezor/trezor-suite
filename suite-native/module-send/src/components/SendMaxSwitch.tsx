import { Keyboard } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

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
import { BigNumber } from '@trezor/utils';

import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';

type SendMaxSwitchProps = {
    outputIndex: number;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    maxSpendableAmount?: string;
};

export const SendMaxSwitch = ({
    outputIndex,
    accountKey,
    tokenContract,
    maxSpendableAmount,
}: SendMaxSwitchProps) => {
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

    const converters = useCryptoFiatConverters({ symbol, tokenContract });
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();

    const [outputs, setMaxOutputId] = watch(['outputs', 'setMaxOutputId']);

    const isMainnetSendMaxAvailable = !tokenContract && outputs.length === 1;
    const isSendMaxAvailable = tokenContract || isMainnetSendMaxAvailable;

    const isSendMaxEnabled = setMaxOutputId === outputIndex;

    const isSendMaxVisible = isSendMaxAvailable && !!maxSpendableAmount;

    const enableSendMax = () => {
        if (!maxSpendableAmount) return;

        setValue('setMaxOutputId', outputIndex);

        setValue(getOutputFieldName(outputIndex, 'amount'), maxSpendableAmount, {
            shouldValidate: true,
            shouldTouch: true,
        });

        const fiatValue = converters?.convertCryptoToFiat(new BigNumber(maxSpendableAmount));
        if (fiatValue && decimals !== null) {
            setValue(
                getOutputFieldName(outputIndex, 'fiat'),
                fiatValue?.toFixed(decimalsForBaseCurrency),
            );
        }
    };

    const disableSendMax = () => {
        setValue('setMaxOutputId', undefined);
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
        isSendMaxVisible && (
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
