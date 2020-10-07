import React from 'react';
import { Translation } from '@suite-components';
import { TrezorDevice, ExtendedMessageDescriptor } from '@suite-types';
import messages from '@suite/support/messages';

interface Props {
    device: TrezorDevice;
    useDeviceLabel?: boolean;
}

const Wallet = (props: Props) => {
    const { device } = props;
    let walletLabel: ExtendedMessageDescriptor | undefined;
    if (device.state) {
        walletLabel = device.useEmptyPassphrase
            ? messages.TR_NO_PASSPHRASE_WALLET
            : {
                  ...messages.TR_PASSPHRASE_WALLET,
                  values: {
                      id: device.instance,
                  },
              };
    }

    const label = walletLabel ? <Translation {...walletLabel} /> : null;

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
