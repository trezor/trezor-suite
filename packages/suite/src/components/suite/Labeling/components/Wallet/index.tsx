import React from 'react';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';

interface Props {
    device: TrezorDevice;
    useDeviceLabel?: boolean;
}

export default (props: Props) => {
    const { device } = props;
    // let walletLabel: ExtendedMessageDescriptor | string;
    // if (device.metadata.status === 'enabled' && device.metadata.walletLabel) {
    //     walletLabel = device.metadata.walletLabel;
    // } else {
    const walletLabel = device.useEmptyPassphrase
        ? messages.TR_NO_PASSPHRASE_WALLET
        : {
              ...messages.TR_PASSPHRASE_WALLET,
              values: {
                  id: device.instance,
              },
          };
    // }

    const label =
        typeof walletLabel === 'string' ? <>{walletLabel}</> : <Translation {...walletLabel} />;

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
