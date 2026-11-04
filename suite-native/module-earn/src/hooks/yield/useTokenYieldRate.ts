import { type Account } from '@suite-common/wallet-types';
import {
    EARN_PROMO_SYMBOLS,
    type TokenYieldRateToken,
    type TokenYieldRateVariant,
    useAssetYieldRate,
} from '@suite-native/earn';

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
