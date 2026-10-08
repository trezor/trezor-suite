import { type ReactNode, createContext, useContext } from 'react';

import type { EvmNonceInfo } from '@suite-common/wallet-utils';

type ProvidedEvmNonceInfo = { nonceInfo: EvmNonceInfo | undefined };

const EvmNonceInfoContext = createContext<ProvidedEvmNonceInfo | null>(null);

type EvmNonceInfoProviderProps = {
    /** `null` leaves each transaction to read the nonce from the wallet store. */
    value: ProvidedEvmNonceInfo | null;
    children: ReactNode;
};

/** The account's nonce for the transactions rendered below, read once for all of them. */
export const EvmNonceInfoProvider = ({ value, children }: EvmNonceInfoProviderProps) => (
    <EvmNonceInfoContext.Provider value={value}>{children}</EvmNonceInfoContext.Provider>
);

/** The account's nonce provided above, or `null` when nothing provides it. */
export const useProvidedEvmNonceInfo = () => useContext(EvmNonceInfoContext);
