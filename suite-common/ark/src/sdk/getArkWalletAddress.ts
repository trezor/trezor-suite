import { type IReadonlyWallet } from '@arkade-os/sdk';

// This returns the offchain Ark receive address. The wallet may rotate it
// across calls depending on `walletMode`; defaults to HD rotation.
export const getArkWalletAddress = (wallet: IReadonlyWallet) => wallet.getAddress();
