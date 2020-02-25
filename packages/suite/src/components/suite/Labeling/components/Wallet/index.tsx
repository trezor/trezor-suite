import React from 'react';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { Props } from './Container';

export default (props: Props) => {
    const { device, labeling } = props;
    const key = `wallet:${device.state}`;
    let walletLabel: any;
    if (labeling[key]) {
        walletLabel = labeling[key];
    } else {
        walletLabel = device.useEmptyPassphrase
            ? messages.TR_NO_PASSPHRASE_WALLET
            : {
                  ...messages.TR_PASSPHRASE_WALLET,
                  values: {
                      id: device.instance,
                  },
              };
    }

    if (props.useDeviceLabel) {
        return (
            <Translation
                id="ignored"
                defaultMessage="{deviceLabel} {walletLabel}"
                values={{
                    deviceLabel: device.label,
                    walletLabel,
                }}
            />
        );
    }

    return (
        <Translation
            id="ignored"
            defaultMessage="{walletLabel}"
            values={{
                walletLabel,
            }}
        />
    );
};
