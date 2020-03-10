import React from 'react';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import messages from '@suite/support/messages';
import { Props } from './Container';

export default (props: Props) => {
    const { device, labeling } = props;
    const key = `wallet:${device.state}`;
    let walletLabel: ExtendedMessageDescriptor | string;
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
