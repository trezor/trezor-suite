import { type Account } from '@suite-common/wallet-types';

import {
    type TokenYieldRateToken,
    type TokenYieldRateVariant,
    useAssetYieldRate,
} from './useAssetYieldRate';

type UseTokenYieldRateParams = {
    account: Account;
    /** Native-coin rows pass no token — wrapped-native vaults match the native balance. */
    token?: TokenYieldRateToken;
    variant: TokenYieldRateVariant;
};

/** The rate an account row may advertise, staking counted only where the platform can stake. */
export const useTokenYieldRate = ({ account, token, variant }: UseTokenYieldRateParams) =>
    useAssetYieldRate({
        networkSymbol: account.symbol,
        token,
        variant,
        stakingScope: 'manageable',
        accountKey: account.key,
    });
