import React from 'react';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';

interface Props {
    device: TrezorDevice;
    useDeviceLabel?: boolean;
}

export const WalletLabeling = (props: Props) => {
    const { device } = props;

    let label: string | ReturnType<typeof Translation>;

    if (device.metadata.status === 'enabled' && device.metadata.walletLabel) {
        // if metadata enabled, use it
        label = device.metadata.walletLabel;
    } else {
        // otherwise create standard label
        label = device.useEmptyPassphrase ? (
            <Translation id="TR_NO_PASSPHRASE_WALLET" />
        ) : (
            <Translation id="TR_PASSPHRASE_WALLET" values={{ id: device.instance }} />
        );
    }

    if (props.useDeviceLabel) {
        return (
            <>
                {`${device.label} `}
                {label}
            </>
        );
    }

    return <>{label}</>;
};
