import { StaticSessionId } from '@trezor/connect';

export type TurnOnSuiteSyncForWalletParams = { staticSessionId: StaticSessionId | undefined };

export type TurnOnSuiteSyncForWallet = (params: TurnOnSuiteSyncForWalletParams) => Promise<void>;

export type TurnOnSuiteSyncForWalletDep = {
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};
