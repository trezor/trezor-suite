import { useCallback } from 'react';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkFeatures,
    isNetworkSymbol,
} from '@suite-common/wallet-config';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite';
import {
    ConfirmValueModal,
    ConfirmValueModalProps,
} from 'src/components/suite/modals/ReduxModal/ConfirmValueModal/ConfirmValueModal';
import { useDisplayMode, useSelector } from 'src/hooks/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { selectAccountIncludingChosenInCoinmarket } from 'src/reducers/wallet/selectedAccountReducer';
import { cryptoIdToSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';

import { ConfirmActionModal } from './DeviceContextModal/ConfirmActionModal';

interface ConfirmAddressModalProps
    extends Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel' | 'value'> {
    addressPath: string;
}

export const ConfirmAddressModal = ({ addressPath, value, ...props }: ConfirmAddressModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectAccountIncludingChosenInCoinmarket);
    const { modalCryptoId } = useSelector(state => state.wallet.coinmarket);
    const displayMode = useDisplayMode({ type: 'address' });
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (!device) return null;
    // TODO: special case for Connect Popup
    if (!account) return <ConfirmActionModal device={device} />;

    const isTokensNetwork = getNetworkFeatures(account.symbol).includes('tokens');

    const getHeading = () => {
        if (modalCryptoId) {
            const coinSymbol = cryptoIdToCoinSymbol(modalCryptoId)?.toLowerCase();
            const symbol = cryptoIdToSymbol(modalCryptoId);

            if (symbol && coinSymbol !== symbol) {
                return (
                    <Translation
                        id="TR_ADDRESS_MODAL_TITLE_EXCHANGE"
                        values={{
                            networkName: getNetwork(symbol).name,
                            networkCurrencyName: coinSymbol?.toUpperCase(),
                        }}
                    />
                );
            }

            return (
                <Translation
                    id="TR_ADDRESS_MODAL_TITLE"
                    values={{
                        networkName:
                            coinSymbol && isNetworkSymbol(coinSymbol)
                                ? getNetwork(coinSymbol).name
                                : coinSymbol?.toUpperCase(),
                    }}
                />
            );
        }

        return (
            <Translation
                id="TR_ADDRESS_MODAL_TITLE"
                values={{
                    networkName: getNetwork(account.symbol).name,
                }}
            />
        );
    };

    return (
        <ConfirmValueModal
            account={account}
            heading={getHeading()}
            description={
                modalCryptoId ? null : (
                    <Translation
                        id={
                            isTokensNetwork
                                ? 'TR_ADDRESS_MODAL_DESCRIPTION_TOKENS'
                                : 'TR_ADDRESS_MODAL_DESCRIPTION'
                        }
                        values={{
                            displaySymbol: getNetworkDisplaySymbol(account.symbol),
                        }}
                    />
                )
            }
            stepLabel={<Translation id="TR_RECEIVE_ADDRESS" />}
            confirmStepLabel={<Translation id="TR_RECEIVE_ADDRESS_MATCH" />}
            copyButtonText={
                modalCryptoId ? (
                    <Translation id="TR_CONFIRM" />
                ) : (
                    <Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />
                )
            }
            validateOnDevice={validateAddress}
            value={value}
            data-testid="@metadata/copy-address-button"
            displayMode={displayMode}
            {...props}
        />
    );
};
