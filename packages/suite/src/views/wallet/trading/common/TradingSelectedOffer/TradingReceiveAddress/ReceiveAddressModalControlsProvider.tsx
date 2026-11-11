import { type ReactNode } from 'react';

import { TradingReceiveAccountModal } from './TradingReceiveAccountModal/TradingReceiveAccountModal';
import { TradingReceiveAddressModal } from './TradingReceiveAddressModal';
import { TradingUtxoReceiveAddressModal } from './TradingUtxoReceiveAddressModal/TradingUtxoReceiveAddressModal';
import {
    ReceiveAddressModalControlsContext,
    useReceiveAddressModal,
} from './useReceiveAddressModalControls';

type ReceiveAddressModalControlsProviderProps = { children: ReactNode };

export const ReceiveAddressModalControlsProvider = ({
    children,
}: ReceiveAddressModalControlsProviderProps) => {
    const modal = useReceiveAddressModal();

    return (
        <ReceiveAddressModalControlsContext.Provider value={modal}>
            {children}

            {modal.activeModal === 'accountModal' && <TradingReceiveAccountModal />}

            {modal.activeModal === 'customAddressModal' && <TradingReceiveAddressModal />}

            {modal.activeModal === 'utxoAddressModal' && <TradingUtxoReceiveAddressModal />}
        </ReceiveAddressModalControlsContext.Provider>
    );
};
