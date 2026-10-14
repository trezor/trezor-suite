import { type ReactNode, createContext, useContext, useState } from 'react';

import { throwError } from '@trezor/utils';

import { TradingReceiveAccountModal } from './TradingReceiveAccountModal/TradingReceiveAccountModal';
import { TradingReceiveAddressModal } from './TradingReceiveAddressModal';
import { TradingUtxoReceiveAddressModal } from './TradingUtxoReceiveAddressModal/TradingUtxoReceiveAddressModal';

type ReceiveAddressModal = 'accountModal' | 'customAddressModal' | 'utxoAddressModal';

const useReceiveAddressModal = () => {
    const [activeModal, setActiveModal] = useState<ReceiveAddressModal>();

    const open = (id: ReceiveAddressModal) => {
        setActiveModal(id);
    };

    const close = () => {
        setActiveModal(undefined);
    };

    return { activeModal, open, close };
};

type ReceiveAddressModalControlsContextType = ReturnType<typeof useReceiveAddressModal>;

const ReceiveAddressModalControlsContext = createContext<
    ReceiveAddressModalControlsContextType | undefined
>(undefined);

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

export const useReceiveAddressModalControls = () =>
    useContext(ReceiveAddressModalControlsContext) ??
    throwError(
        'useReceiveAddressModalControls must be used within a ReceiveAddressModalControlsProvider',
    );
