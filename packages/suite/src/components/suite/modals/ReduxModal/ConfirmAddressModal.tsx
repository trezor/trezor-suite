import { useCallback } from 'react';

import { selectSelectedDevice } from '@suite-common/wallet-core';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite';
import {
    ConfirmValueModal,
    ConfirmValueModalProps,
} from 'src/components/suite/modals/ReduxModal/ConfirmValueModal/ConfirmValueModal';
import { useSelector } from 'src/hooks/suite';
import { selectAccountIncludingChosenInTrading } from 'src/reducers/wallet/selectedAccountReducer';

import { ConfirmActionModal } from './DeviceContextModal/ConfirmActionModal';

interface ConfirmAddressModalProps
    extends Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel' | 'value'> {
    addressPath: string;
}

export const ConfirmAddressModal = ({ addressPath, value, ...props }: ConfirmAddressModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const isTradingFlow = useSelector(state => !!state.wallet.trading.modalAccountKey);

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (!device) return null;
    // TODO: special case for Connect Popup
    if (!account) return <ConfirmActionModal device={device} />;

    return (
        <ConfirmValueModal
            account={account}
            heading={<Translation id="TR_RECEIVE" />}
            label={<Translation id="TR_ADDRESS" />}
            validateOnDevice={validateAddress}
            areStepsVisible={!isTradingFlow}
            isCopyButtonVisible={!isTradingFlow}
            value={value}
            data-testid="@metadata/copy-address-button"
            {...props}
        />
    );
};
