import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { HStack, Radio, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-common/icons';
import { TrezorDevice } from '@suite-common/suite-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDevice, selectDeviceByState } from '@suite-common/wallet-core';

type WalletItemProps = {
    deviceState: NonNullable<TrezorDevice['state']>;
    onPress: () => void;
    isSelectable?: boolean;
};

const walletItemStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    paddingHorizontal: utils.spacings.medium,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    gap: 12,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderWidth: utils.borders.widths.small,
    borderRadius: 12,
    borderColor: utils.colors.borderElevation1,
    extend: {
        condition: isSelected,
        style: {
            borderWidth: utils.borders.widths.large,
            borderColor: utils.colors.borderSecondary,
        },
    },
}));

export const WalletItem = ({ deviceState, onPress, isSelectable = true }: WalletItemProps) => {
    const { applyStyle } = useNativeStyles();
    const device = useSelector((state: any) => selectDeviceByState(state, deviceState));
    const selectedDevice = useSelector(selectDevice);

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
                style={applyStyle(walletItemStyle, { isSelected: showAsSelected })}
            >
                <HStack alignItems="center">
                    <Icon
                        name={device.useEmptyPassphrase ? 'standardWallet' : 'password'}
                        size="mediumLarge"
                    />
                    <Text variant="callout">{walletNameLabel}</Text>
                </HStack>
                {isSelectable && <Radio value="" onPress={onPress} isChecked={isSelected} />}
            </HStack>
        </Pressable>
    );
};
