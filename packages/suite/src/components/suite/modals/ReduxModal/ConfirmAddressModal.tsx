import { useCallback } from 'react';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectTradingModalAccountKey } from '@suite-common/trading';
import { selectSelectedDevice } from '@suite-common/wallet-core';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite';
import {
    ConfirmValueModal,
    ConfirmValueModalProps,
} from 'src/components/suite/modals/ReduxModal/ConfirmValueModal/ConfirmValueModal';
import { useSelector } from 'src/hooks/suite';
import { selectAccountIncludingChosenInTrading } from 'src/reducers/wallet/selectedAccountReducer';

import { ConnectAddressConfirmation } from './UserContextModal/ConnectAddressConfirmation';

interface ConfirmAddressModalProps
    extends Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel' | 'value'> {
    addressPath: string;
}

export const ConfirmAddressModal = ({ addressPath, value, ...props }: ConfirmAddressModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const isTradingFlow = useSelector(selectTradingModalAccountKey);
    const isConnectPopup = useSelector(
        state => selectConnectPopupCall(state)?.state === 'address-confirmation',
    );

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (isConnectPopup) return <ConnectAddressConfirmation />;
    if (!device) return null;

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
