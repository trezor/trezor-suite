import { type Account } from '@suite-common/wallet-types';

import {
    type TokenYieldRateToken,
    type TokenYieldRateVariant,
    useAssetYieldRate,
} from './useAssetYieldRate';
import { EARN_PROMO_SYMBOLS } from '../utils/promotedRateUtils';

type UseTokenYieldRateParams = {
    account: Account;
    /** Native-coin rows pass no token — wrapped-native vaults match the native balance. */
    token?: TokenYieldRateToken;
    variant: TokenYieldRateVariant;
};

/** The rate an account row may advertise, staking counted only for the promoted coins. */
export const useTokenYieldRate = ({ account, token, variant }: UseTokenYieldRateParams) =>
    useAssetYieldRate({
        networkSymbol: account.symbol,
        token,
        variant,
        stakingSymbols: EARN_PROMO_SYMBOLS,
        accountKey: account.key,
    });
