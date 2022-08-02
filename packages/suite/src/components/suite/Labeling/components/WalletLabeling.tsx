import React from 'react';
import { TrezorDevice } from '@suite-types';
import { useTranslation } from '@suite-hooks/useTranslation';

interface WalletLabellingProps {
    device: TrezorDevice;
    shouldUseDeviceLabel?: boolean;
}

export const WalletLabeling = ({ device, shouldUseDeviceLabel }: WalletLabellingProps) => {
    const { translationString } = useTranslation();

    let label: string | null = null;
    if (device.metadata.status === 'enabled' && device.metadata.walletLabel) {
        label = device.metadata.walletLabel;
    } else if (device.state) {
        label = device.useEmptyPassphrase
            ? translationString('TR_NO_PASSPHRASE_WALLET')
            : translationString('TR_PASSPHRASE_WALLET', { id: device.walletNumber });
    }

    if (shouldUseDeviceLabel) {
        return <>{`${device.label} ${label}`}</>;
    }

    return <>{label}</>;
};
