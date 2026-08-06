import { type ReactNode, createContext, useContext, useState } from 'react';

import { throwError } from '@trezor/utils';

import { TradingExtraFieldModal } from './TradingExtraFieldModal';
import { TradingReceiveAccountModal } from './TradingReceiveAccountModal/TradingReceiveAccountModal';
import { TradingReceiveAddressModal } from './TradingReceiveAddressModal';
import { TradingUtxoReceiveAddressModal } from './TradingUtxoReceiveAddressModal/TradingUtxoReceiveAddressModal';

type ReceiveAddressModal =
    'accountModal' | 'customAddressModal' | 'utxoAddressModal' | 'extraFieldModal';

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

export const ReceiveAddressModalControlsProvider = ({ children }: { children: ReactNode }) => {
    const modal = useReceiveAddressModal();

    return (
        <ReceiveAddressModalControlsContext.Provider value={modal}>
            {children}

            {modal.activeModal === 'accountModal' && <TradingReceiveAccountModal />}

            {modal.activeModal === 'customAddressModal' && <TradingReceiveAddressModal />}

            {modal.activeModal === 'utxoAddressModal' && <TradingUtxoReceiveAddressModal />}

            {modal.activeModal === 'extraFieldModal' && <TradingExtraFieldModal />}
        </ReceiveAddressModalControlsContext.Provider>
    );
};

export const useReceiveAddressModalControls = () =>
    useContext(ReceiveAddressModalControlsContext) ??
    throwError(
        'useReceiveAddressModalControls must be used within a ReceiveAddressModalControlsProvider',
    );
