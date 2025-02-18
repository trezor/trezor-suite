import React, { createContext, useContext, useState } from 'react';

type PassphraseWalletExistsState =
    | 'exists-enter-passphrase'
    | 'exists-best-practices'
    | 'exists-empty-wallet'
    | 'exists-passphrase-mismatch'
    | 'exists-passphrase-duplicate'
    | 'exists-confirm-passphrase';

type PassphraseWalletNotExistsState =
    | 'not-exist-enter-passphrase'
    | 'not-exist-best-practices'
    | 'not-exist-passphrase-mismatch'
    | 'not-exist-passphrase-duplicate'
    | 'not-exist-confirm-passphrase';

type PassphraseWalletState =
    | 'initial'
    | PassphraseWalletExistsState
    | PassphraseWalletNotExistsState;

const INITIAL_STATE: PassphraseWalletState = 'initial';

type PassphraseModalContextType = {
    passphraseState: PassphraseWalletState;
    setPassphraseState: (passphraseState: PassphraseWalletState) => void;
    isExisting: boolean;
    setIsExisting: (isExisting: boolean) => void;
};

type PassphraseModalProviderProps = {
    children: React.ReactNode;
};

const initialPassphraseModal: PassphraseModalContextType = {
    passphraseState: INITIAL_STATE,
    setPassphraseState: () => {},
    isExisting: false,
    setIsExisting: () => {},
};

export const PassphraseModalContext =
    createContext<PassphraseModalContextType>(initialPassphraseModal);

export const PassphraseModalProvider = ({ children }: PassphraseModalProviderProps) => {
    const [passphraseState, setPassphraseState] = useState<PassphraseWalletState>(
        initialPassphraseModal.passphraseState,
    );
    const [isExisting, setIsExisting] = useState<boolean>(false);

    const value: PassphraseModalContextType = {
        passphraseState,
        setPassphraseState,
        isExisting,
        setIsExisting,
    };

    return (
        <PassphraseModalContext.Provider value={value}>{children}</PassphraseModalContext.Provider>
    );
};

PassphraseModalProvider.displayName = 'PassphraseModalProvider';

export const usePassphraseModalContext = () => {
    const context = useContext(PassphraseModalContext);
    if (!context) {
        throw new Error('usePassphraseModalContext must be used within a PassphraseModalProvider');
    }

    return context;
};
