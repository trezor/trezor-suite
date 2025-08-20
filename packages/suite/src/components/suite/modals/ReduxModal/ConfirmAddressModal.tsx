import { useCallback } from 'react';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import {
    cryptoIdToSymbol,
    selectTradingModalAccountKey,
    useTradingInfo,
} from '@suite-common/trading';
import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config/src/utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite';
import {
    ConfirmValueModal,
    ConfirmValueModalProps,
} from 'src/components/suite/modals/ReduxModal/ConfirmValueModal/ConfirmValueModal';
import { useSelector } from 'src/hooks/suite';
import { selectAccountIncludingChosenInTrading } from 'src/reducers/wallet/selectedAccountReducer';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

import { ConnectAddressConfirmation } from './UserContextModal/ConnectAddressConfirmation';

interface ConfirmAddressModalProps
    extends Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel' | 'value'> {
    addressPath: string;
}

export const ConfirmAddressModal = ({ addressPath, value, ...props }: ConfirmAddressModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectAccountIncludingChosenInTrading);
    const isTradingFlow = useSelector(selectTradingModalAccountKey);
    const { modalCryptoId } = useSelector(state => state.wallet.tradingNew);
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const isConnectPopup = useSelector(
        state => selectConnectPopupCall(state)?.state === 'address-confirmation',
    );
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (isConnectPopup) return <ConnectAddressConfirmation />;
    if (!device) return null;

    const getHeading = () => {
        if (modalCryptoId) {
            const symbol = cryptoIdToSymbol(modalCryptoId);
            const { coinSymbol, contractAddress } =
                cryptoIdToSymbolAndContractAddress(modalCryptoId);
            const networkCurrencyName = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

            if (contractAddress) {
                const networkName = symbol ? getNetwork(symbol).name : coinSymbol?.toUpperCase();

                return (
                    <Translation
                        id="TR_ADDRESS_MODAL_TITLE_EXCHANGE"
                        values={{
                            networkName,
                            networkCurrencyName,
                        }}
                    />
                );
            }

            return (
                <Translation
                    id="TR_ADDRESS_MODAL_TITLE"
                    values={{
                        networkName: networkCurrencyName,
                    }}
                />
            );
        }

        if (!account) {
            return <Translation id="TR_RECEIVE" />;
        }

        const hasTokens = hasNetworkFeatures(account, 'tokens', isDebugModeActive);
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
            areStepsVisible={!isTradingFlow}
            isCopyButtonVisible={!isTradingFlow}
            value={value}
            data-testid="@metadata/copy-address-button"
            {...props}
        />
    );
};
