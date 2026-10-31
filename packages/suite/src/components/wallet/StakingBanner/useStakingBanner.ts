import { type BooleanFlagKey, selectFlags, setFlag } from '@suite/flags';
import {
    getStakingLimitsByNetworkSymbol,
    isSupportedStakingNetworkSymbol,
    selectAccountIsStakingActive,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

import { useEarnEthBanner } from './useEarnEthBanner';

export type StakingBannerKind = 'earnEth' | 'staking';

export type StakingBannerAccounts = readonly [Account, ...Account[]];

export const isStakingBannerAccounts = (
    accounts: readonly Account[],
): accounts is StakingBannerAccounts => accounts.length > 0;

const getStakingBannerClosedFlag = (account: Account): BooleanFlagKey | undefined => {
    switch (account.networkType) {
        case 'ethereum':
            return 'stakeEthBannerClosed';
        case 'solana':
            return 'stakeSolBannerClosed';
        case 'cardano':
            return 'stakeCardanoBannerClosed';
        case 'tron':
            return 'stakeTronBannerClosed';
        default:
            if (isSupportedStakingNetworkSymbol(account.symbol)) {
                exhaustive(
                    account.networkType as never,
                    `Add missing case for ${account.symbol} network type`,
                );
            }

            return undefined;
    }
};

export const useStakingBanner = (accounts: StakingBannerAccounts) => {
    const [account] = accounts;
    const { dispatch } = useServices(injectDispatch);
    const flags = useSelector(selectFlags);
    const isStakingActive = useSelector(state =>
        accounts.every(({ key }) => selectAccountIsStakingActive(state, key)),
    );
    const earnEthBanner = useEarnEthBanner(account);

    const stakingClosedFlag = getStakingBannerClosedFlag(account);

    const getKind = (): StakingBannerKind | undefined => {
        if (earnEthBanner.isResolving) {
            return undefined;
        }

        // The earn promo has its own dismissal flag and is shown even to users who
        // already stake or closed the staking banner before the promo existed.
        if (earnEthBanner.hasYieldOption) {
            return flags.earnEthBannerClosed ? undefined : 'earnEth';
        }

        if (
            stakingClosedFlag === undefined ||
            flags[stakingClosedFlag] ||
            isStakingActive ||
            !getStakingLimitsByNetworkSymbol(account.symbol)
        ) {
            return undefined;
        }

        return 'staking';
    };

    const kind = getKind();

    const close = () => {
        const closedFlag = kind === 'earnEth' ? 'earnEthBannerClosed' : stakingClosedFlag;

        if (closedFlag !== undefined) {
            dispatch(setFlag({ key: closedFlag, value: true }));
        }
    };

    return { kind, earnEthApy: earnEthBanner.apy, close };
};
