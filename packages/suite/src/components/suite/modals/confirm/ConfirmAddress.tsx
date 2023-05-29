import React from 'react';

import { Translation } from '@suite-components';
import { NetworkSymbol } from '@wallet-types';
import { ConfirmValueOnDevice, ConfirmDeviceScreenProps } from './ConfirmValueOnDevice';

interface ConfirmAddressProps
    extends Pick<
        ConfirmDeviceScreenProps,
        'device' | 'isCancelable' | 'isConfirmed' | 'onCancel' | 'value'
    > {
    symbol: NetworkSymbol;
}

export const ConfirmAddress = ({ symbol, ...props }: ConfirmAddressProps) => (
    <ConfirmValueOnDevice
        heading={
            <Translation
                id="TR_ADDRESS_MODAL_TITLE"
                values={{ networkName: symbol.toUpperCase() }}
            />
        }
        copyButtonText={<Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />}
        copyButtonDataTest="@metadata/copy-address-button"
        valueDataTest="@modal/confirm-address/address-field"
        {...props}
    />
);
