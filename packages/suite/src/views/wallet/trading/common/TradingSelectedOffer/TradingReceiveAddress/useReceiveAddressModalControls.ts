import { createContext, useContext, useState } from 'react';

import { throwError } from '@trezor/utils';

type ReceiveAddressModal = 'accountModal' | 'customAddressModal' | 'utxoAddressModal';

export const useReceiveAddressModal = () => {
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

export const ReceiveAddressModalControlsContext = createContext<
    ReceiveAddressModalControlsContextType | undefined
>(undefined);

export const useReceiveAddressModalControls = () =>
    useContext(ReceiveAddressModalControlsContext) ??
    throwError(
        'useReceiveAddressModalControls must be used within a ReceiveAddressModalControlsProvider',
    );
