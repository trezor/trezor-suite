import type { WalletDescriptor } from '@suite-common/wallet-types';

export type ArkAccount = {
    accountNumber: number;
    walletDescriptor: WalletDescriptor;
    walletKey: string;
};

// Ark is a Suite-only product surface, not a Connect coin or shared
// network. The symbol exists only so feature code can tag Ark-related
// store entries; do not add it to any shared network registry.
export const ARK_NETWORK_SYMBOL = 'ark';

export const createArkWalletKey = ({
    walletDescriptor,
    accountNumber,
}: {
    walletDescriptor: WalletDescriptor;
    accountNumber: number;
}) => `${walletDescriptor}:${accountNumber}`;
