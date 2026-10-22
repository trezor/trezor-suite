import { type AccountKey } from '@suite-common/wallet-types';

// Readiness is read only in Detox test builds, where Metro resolves screenReadiness.e2e.ts instead
// of this file, so no other build subscribes to the store for it.
export const useIsHomeScreenReady = () => false;

export const useIsAccountsScreenReady = () => false;

export const useIsReceiveScreenReady = (_accountKey: AccountKey | undefined) => false;
