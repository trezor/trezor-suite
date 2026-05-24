import { type IWallet } from '@arkade-os/sdk';

// This returns the full balance summary as exposed by the SDK so the UI
// can decide which slice to show (available, settled, boarding, etc.).
// We deliberately do not collapse to a single number here.
export const getArkWalletBalance = (wallet: IWallet) => wallet.getBalance();
