import { useCallback } from 'react';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config/src/utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite/Translation';
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
    const isConnectPopup = useSelector(
        state => selectConnectPopupCall(state)?.state === 'address-confirmation',
    );

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (isConnectPopup) return <ConnectAddressConfirmation />;
    if (!device) return null;

    const getHeading = () => {
        if (!account) {
            return <Translation id="TR_RECEIVE" />;
        }

        const hasTokens = hasNetworkFeatures(account, 'tokens');
        if (hasTokens) {
            return (
                <Translation
                    id="TR_RECEIVE_NETWORK_INCLUDING_TOKENS"
                    values={{
                        networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                    }}
                />
            );
        }

        return (
            <Translation
                id="TR_RECEIVE_NETWORK"
                values={{
                    networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                }}
            />
        );
    };

    return (
        <ConfirmValueModal
            account={account}
            heading={getHeading()}
            label={<Translation id="TR_ADDRESS" />}
            validateOnDevice={validateAddress}
            value={value}
            isAddress={true}
            data-testid="@metadata/copy-address-button"
            {...props}
        />
    );
};
