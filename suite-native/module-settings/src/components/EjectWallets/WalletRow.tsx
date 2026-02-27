import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { HStack, Loader, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { WalletLabel } from '@suite-native/labeling';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { WalletRememberModeIconButton } from './WalletRememberModeIconButton';

type WalletRowProps = {
    device: TrezorDevice;
};

const walletRowStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
}));

export const WalletRow = ({ device }: WalletRowProps) => {
    const { applyStyle } = useNativeStyles();
    const hasDiscovery = useSelector(selectHasRunningDiscovery);

    const walletNameLabel = device.useEmptyPassphrase ? (
        <Translation id="moduleSettings.viewOnly.wallet.standard" />
    ) : (
        <Translation
            id="moduleSettings.viewOnly.wallet.defaultPassphrase"
            values={{ index: device.walletNumber }}
        />
    );

    const showToggleButton = device.remember || !hasDiscovery;

    return (
        <HStack key={device.instance} style={applyStyle(walletRowStyle)}>
            <HStack spacing="sp12" alignItems="center">
                <Icon name={device.useEmptyPassphrase ? 'wallet' : 'password'} size="mediumLarge" />
                <Text variant="body-sm-strong">
                    <WalletLabel
                        deviceStaticSessionId={device.state?.staticSessionId}
                        fallbackLabel={walletNameLabel}
                    />
                </Text>
            </HStack>
            {showToggleButton ? (
                <WalletRememberModeIconButton device={device} />
            ) : (
                <Loader size="small" />
            )}
        </HStack>
    );
};
