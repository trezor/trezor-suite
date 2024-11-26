import { useCallback } from 'react';

import { selectDevice } from '@suite-common/wallet-core';

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
    const device = useSelector(selectDevice);
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

    const getHeading = () => {
        if (modalCryptoId) {
            const coinSymbol = cryptoIdToCoinSymbol(modalCryptoId)?.toUpperCase();
            const symbol = cryptoIdToSymbol(modalCryptoId)?.toUpperCase();

            if (symbol && coinSymbol !== symbol) {
                return (
                    <Translation
                        id="TR_ADDRESS_MODAL_TITLE_EXCHANGE"
                        values={{
                            networkName: symbol,
                            networkCurrencyName: coinSymbol,
                        }}
                    />
                );
            }

            return (
                <Translation
                    id="TR_ADDRESS_MODAL_TITLE"
                    values={{
                        networkName: coinSymbol,
                    }}
                />
            );
        }

        return (
            <Translation
                id="TR_ADDRESS_MODAL_TITLE"
                values={{
                    networkName: account.symbol.toUpperCase(),
                }}
            />
        );
    };

    return (
        <ConfirmValueModal
            account={account}
            heading={getHeading()}
            stepLabel={<Translation id="TR_RECEIVE_ADDRESS" />}
            confirmStepLabel={<Translation id="TR_RECEIVE_ADDRESS_MATCH" />}
            copyButtonText={<Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />}
            validateOnDevice={validateAddress}
            value={value}
            data-testid="@metadata/copy-address-button"
            displayMode={displayMode}
            {...props}
        />
    );
};
