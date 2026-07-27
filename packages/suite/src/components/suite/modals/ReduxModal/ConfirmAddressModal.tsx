import { useCallback } from 'react';

import { selectAccountIncludingChosenInTrading } from '@suite/account';
import { Translation } from '@suite/intl';
import { showAddressThunk } from '@suite/receive';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config/src/utils';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';

import {
    ConfirmValueModal,
    type ConfirmValueModalProps,
} from 'src/components/suite/modals/ReduxModal/ConfirmValueModal/ConfirmValueModal';
import { useSelector } from 'src/hooks/suite';

import { ConnectAddressConfirmation } from './UserContextModal/ConnectAddressConfirmation';
import { ConnectSelectAccount } from './UserContextModal/ConnectSelectAccount/ConnectSelectAccount';

interface ConfirmAddressModalProps extends Pick<
    ConfirmValueModalProps,
    'isConfirmed' | 'onCancel' | 'value'
> {
    addressPath: string;
}

export const ConfirmAddressModal = ({ addressPath, value, ...props }: ConfirmAddressModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const popupCallState = useSelector(state => selectConnectPopupCall(state)?.state);

    const validateAddress = useCallback(
        () => showAddressThunk({ path: addressPath, address: value }),
        [addressPath, value],
    );

    if (popupCallState === 'address-confirmation') return <ConnectAddressConfirmation />;
    if (popupCallState === 'select-account') return <ConnectSelectAccount />;
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
