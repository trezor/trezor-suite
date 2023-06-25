import React from 'react';

import { Translation } from 'src/components/suite';
import { NetworkSymbol } from 'src/types/wallet';
import { ConfirmValueOnDevice, ConfirmDeviceScreenProps } from './ConfirmValueOnDevice';

interface ConfirmAddressProps
    extends Pick<ConfirmDeviceScreenProps, 'verify' | 'isConfirmed' | 'onCancel' | 'value'> {
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
