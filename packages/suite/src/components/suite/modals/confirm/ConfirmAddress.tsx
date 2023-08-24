import React, { useCallback } from 'react';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { ConfirmValueOnDevice, ConfirmDeviceScreenProps } from './ConfirmValueOnDevice';

interface ConfirmAddressProps
    extends Pick<ConfirmDeviceScreenProps, 'isConfirmed' | 'onCancel' | 'value'> {
    addressPath: string;
}

export const ConfirmAddress = ({ addressPath, value, ...props }: ConfirmAddressProps) => {
    const account = useSelector(selectSelectedAccount);

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (!account) return null;

    return (
        <ConfirmValueOnDevice
            heading={
                <Translation
                    id="TR_ADDRESS_MODAL_TITLE"
                    values={{ networkName: account.symbol.toUpperCase() }}
                />
            }
            copyButtonText={<Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />}
            validateOnDevice={validateAddress}
            value={value}
            copyButtonDataTest="@metadata/copy-address-button"
            valueDataTest="@modal/confirm-address/address-field"
            {...props}
        />
    );
};
