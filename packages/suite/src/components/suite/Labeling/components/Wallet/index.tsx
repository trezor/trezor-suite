import React from 'react';
import { TrezorDevice } from '@suite-types';
import { useTranslation } from '@suite-hooks/useTranslation';

interface Props {
    device: TrezorDevice;
    useDeviceLabel?: boolean;
}

const WalletLabelling = (props: Props) => {
    const { device } = props;
    const { translationString } = useTranslation();

    let label: string | null = null;
    if (device.state) {
        label = device.useEmptyPassphrase
            ? translationString('TR_NO_PASSPHRASE_WALLET')
            : translationString('TR_PASSPHRASE_WALLET', { id: device.walletNumber });
    }

    if (props.useDeviceLabel) {
        return <>{`${device.label} ${label}`}</>;
    }

    return <>{label}</>;
};

export default WalletLabelling;
