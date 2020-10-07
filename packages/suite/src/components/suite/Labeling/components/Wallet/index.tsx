import React from 'react';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';

interface Props {
    device: TrezorDevice;
    useDeviceLabel?: boolean;
}

const Wallet = (props: Props) => {
    const { device } = props;
    let label: JSX.Element | null = null;
    if (device.state) {
        label = (
            <Translation
                {...(device.useEmptyPassphrase
                    ? { id: 'TR_NO_PASSPHRASE_WALLET' }
                    : { id: 'TR_PASSPHRASE_WALLET', values: { id: device.instance } })}
            />
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

    return label;
};

export default Wallet;
