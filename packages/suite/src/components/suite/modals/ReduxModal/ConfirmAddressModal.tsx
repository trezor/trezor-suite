import { useCallback } from 'react';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Translation } from 'src/components/suite';
import { useDisplayMode, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { ConfirmValueModal, ConfirmValueModalProps } from './ConfirmValueModal/ConfirmValueModal';
import {
    cryptoToCoinSymbol,
    cryptoToNetworkSymbol,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

interface ConfirmAddressModalProps
    extends Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel' | 'value'> {
    addressPath: string;
    receiveSymbol?: CryptoSymbol;
}

export const ConfirmAddressModal = ({
    addressPath,
    value,
    receiveSymbol,
    ...props
}: ConfirmAddressModalProps) => {
    const account = useSelector(selectSelectedAccount);
    const displayMode = useDisplayMode();

    const validateAddress = useCallback(
        () => showAddress(addressPath, value),
        [addressPath, value],
    );

    if (!account) return null;

    const getHeading = () => {
        if (receiveSymbol) {
            const coinSymbol = cryptoToCoinSymbol(receiveSymbol).toUpperCase();
            const networkSymbol = cryptoToNetworkSymbol(receiveSymbol)?.toUpperCase();

            if (networkSymbol && coinSymbol !== networkSymbol) {
                return (
                    <Translation
                        id="TR_ADDRESS_MODAL_TITLE_EXCHANGE"
                        values={{
                            networkName: networkSymbol,
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
            }
            stepLabel={<Translation id="TR_RECEIVE_ADDRESS" />}
            confirmStepLabel={<Translation id="TR_RECEIVE_ADDRESS_MATCH" />}
            copyButtonText={<Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />}
            validateOnDevice={validateAddress}
            value={value}
            copyButtonDataTest="@metadata/copy-address-button"
            displayMode={displayMode}
            {...props}
        />
    );
};
