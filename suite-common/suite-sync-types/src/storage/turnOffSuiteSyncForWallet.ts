import { type StaticSessionId } from '@trezor/connect';

export type TurnOffSuiteSyncForWallet = (params: {
    deviceStaticSessionId: StaticSessionId;
}) => void;

export type TurnOffSuiteSyncForWalletDep = {
    turnOffSuiteSyncForWallet: TurnOffSuiteSyncForWallet;
};
