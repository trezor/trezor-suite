import { type IReadonlyWallet } from '@arkade-os/sdk';

// This returns the on-chain boarding address. Funds sent here are minted
// into a VTXO during the next round and become part of the offchain
// available balance.
export const getArkWalletBoardingAddress = (wallet: IReadonlyWallet) => wallet.getBoardingAddress();
