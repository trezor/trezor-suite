import { type StaticSessionId } from '@trezor/connect';

export type TurnOffSuiteSyncForWallet = (params: {
    deviceStaticSessionId: StaticSessionId;
}) => Promise<void>;

export type TurnOffSuiteSyncForWalletDep = {
    turnOffSuiteSyncForWallet: TurnOffSuiteSyncForWallet;
};

export const selectTurnOffSuiteSyncForWalletDep = (
    services: any,
): TurnOffSuiteSyncForWalletDep => ({
    turnOffSuiteSyncForWallet: services.suiteSync.turnOffSuiteSyncForWallet,
});
