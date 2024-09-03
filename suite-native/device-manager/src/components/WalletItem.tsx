import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { HStack, Radio, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-common/icons-deprecated';
import { TrezorDevice } from '@suite-common/suite-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDevice, selectDeviceByState } from '@suite-common/wallet-core';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { selectDeviceTotalFiatBalanceNative } from '@suite-native/device';

type WalletItemProps = {
    deviceState: NonNullable<TrezorDevice['state']>;
    onPress: () => void;
    isSelectable?: boolean;
};

type WalletItemStyleProps = { isSelected: boolean; isSelectable: boolean };

const walletItemStyle = prepareNativeStyle<WalletItemStyleProps>(
    (utils, { isSelected, isSelectable }) => ({
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        gap: 12,
        borderRadius: 12,
        borderColor: utils.colors.borderElevation1,
        flex: 1,
        extend: [
            {
                condition: isSelected,
                style: {
                    borderWidth: utils.borders.widths.large,
                    borderColor: utils.colors.borderSecondary,
                },
            },
            {
                condition: isSelectable,
                style: {
                    paddingHorizontal: utils.spacings.medium,
                    backgroundColor: utils.colors.backgroundSurfaceElevation1,
                    borderWidth: utils.borders.widths.small,
                },
            },
        ],
    }),
);

const labelStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export const WalletItem = ({ deviceState, onPress, isSelectable = true }: WalletItemProps) => {
    const { applyStyle } = useNativeStyles();
    const device = useSelector((state: any) => selectDeviceByState(state, deviceState));
    const selectedDevice = useSelector(selectDevice);
    const fiatBalance = useSelector((state: any) =>
        selectDeviceTotalFiatBalanceNative(state, deviceState),
    );

    if (!device) {
        return null;
    }

    const walletNameLabel = device.useEmptyPassphrase ? (
        <Translation id="deviceManager.wallet.standard" />
    ) : (
        <Translation
            id="deviceManager.wallet.defaultPassphrase"
            values={{ index: device.walletNumber }}
        />
    );

    const isSelected =
        selectedDevice?.id === device.id && selectedDevice?.instance === device.instance;

    const showAsSelected = isSelected && isSelectable;

    return (
        <Pressable onPress={onPress}>
            <HStack
                key={device.instance}
                style={applyStyle(walletItemStyle, { isSelected: showAsSelected, isSelectable })}
            >
                <HStack alignItems="center" flex={1}>
                    <Icon
                        name={device.useEmptyPassphrase ? 'standardWallet' : 'password'}
                        size="mediumLarge"
                    />
                    <Text variant="callout" numberOfLines={1} style={applyStyle(labelStyle)}>
                        {walletNameLabel}
                    </Text>
                </HStack>
                <HStack alignItems="center" spacing={12}>
                    <FiatAmountFormatter
                        value={String(fiatBalance)}
                        variant="hint"
                        color="textSubdued"
                    />
                    {isSelectable && <Radio value="" onPress={onPress} isChecked={isSelected} />}
                </HStack>
            </HStack>
        </Pressable>
    );
};
