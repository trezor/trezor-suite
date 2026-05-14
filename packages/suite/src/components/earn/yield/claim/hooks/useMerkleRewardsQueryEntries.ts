import { useMemo } from 'react';

import { selectIsDebugModeActive } from '@suite/settings';
import { ChainAddressKey } from '@suite-common/earn-stablecoin-api';
import {
    type NetworkSymbol,
    getNetwork,
    isEarnYieldClaimSupported,
} from '@suite-common/wallet-config';
import { type Account, type AccountWithNetworkType } from '@suite-common/wallet-types';
import { unique } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

/**
 * Account with nonce 1 sent only 1 tx (when user supplies, first tx is approval)
 */
function isEmptyEvmAccount(account: AccountWithNetworkType<'ethereum'>) {
    return Number(account?.misc?.nonce ?? 0) <= 1;
}

export type MerkleRewardsSource = {
    symbol: NetworkSymbol;
    address: string;
};

function getMerkleRewardsQueryEntries(sources: MerkleRewardsSource[]) {
    const candidatesForMerkleRewards = sources.flatMap(source => {
        const network = getNetwork(source.symbol);

        if (!network?.chainId) {
            return [];
        }

        return [ChainAddressKey.compose(network.chainId, source.address)];
    });

    return unique(candidatesForMerkleRewards).map(candidate => {
        const { chainId, address } = ChainAddressKey.parse(candidate);

        return { chainId: Number(chainId), address };
    });
}

export function useMerkleRewardsQueryEntries(accounts: Account[]) {
    const isDebugMode = useSelector(selectIsDebugModeActive);

    return useMemo(() => {
        const accountsRewardSources = accounts
            .filter(
                (account): account is AccountWithNetworkType<'ethereum'> =>
                    account?.networkType === 'ethereum' &&
                    isEarnYieldClaimSupported(account.symbol, { isDebugMode }) &&
                    !isEmptyEvmAccount(account),
            )
            .map(account => ({
                symbol: account.symbol,
                address: account.descriptor,
            }));

        return getMerkleRewardsQueryEntries(accountsRewardSources);
    }, [accounts, isDebugMode]);
}
