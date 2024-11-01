import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { HStack, Radio, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-native/icons';
import { TrezorDevice } from '@suite-common/suite-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectDevice,
    selectDeviceByState,
    selectDeviceHasAccountsByDeviceState,
} from '@suite-common/wallet-core';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { selectDeviceTotalFiatBalanceNative } from '@suite-native/device';
import { SettingsSliceRootState } from '@suite-native/settings';

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
        gap: utils.spacings.sp12,
        borderRadius: utils.borders.radii.r12,
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
                    paddingHorizontal: utils.spacings.sp16,
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
    const device = useSelector((state: DeviceRootState) => selectDeviceByState(state, deviceState));
    const hasAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceHasAccountsByDeviceState(state, device?.state),
    );
    const selectedDevice = useSelector(selectDevice);
    const fiatBalance = useSelector(
        (state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState) =>
            selectDeviceTotalFiatBalanceNative(state, deviceState.staticSessionId!),
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
                        name={device.useEmptyPassphrase ? 'wallet' : 'password'}
                        size="mediumLarge"
                    />
                    <Text variant="callout" numberOfLines={1} style={applyStyle(labelStyle)}>
                        {walletNameLabel}
                    </Text>
                </HStack>
                <HStack alignItems="center" spacing="sp12">
                    {hasAccounts && (
                        <FiatAmountFormatter
                            value={String(fiatBalance)}
                            variant="hint"
                            color="textSubdued"
                        />
                    )}
                    {isSelectable && <Radio value="" onPress={onPress} isChecked={isSelected} />}
                </HStack>
            </HStack>
        </Pressable>
    );
};
