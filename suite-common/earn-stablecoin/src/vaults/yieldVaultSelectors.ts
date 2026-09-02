import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import {
    Feature,
    type MessageSystemRootState,
    selectIsYieldFeatureDisabled,
} from '@suite-common/message-system';
import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { getApyPercent, isApyAvailable } from '@suite-common/wallet-utils';

// Each vault can be remotely killed on its own via the message system — a killed vault
// must not be advertised.
export const selectIsYieldVaultDepositEnabled = (
    state: MessageSystemRootState,
    vault: Pick<YieldDtoV2, 'id' | 'outputToken'>,
) =>
    !selectIsYieldFeatureDisabled(
        state,
        Feature.earn.yield.deposit,
        getYieldVaultContractAddress(vault),
    );

/**
 * Picks the not-killed vault with the highest available APY. Returns one of the passed
 * vault objects, so when used in a selector its identity is stable across unrelated
 * store updates.
 */
export const selectBestEnabledYieldVault = (
    state: MessageSystemRootState,
    vaults: YieldDtoV2[],
): YieldDtoV2 | null =>
    vaults.reduce<YieldDtoV2 | null>((best, vault) => {
        if (!selectIsYieldVaultDepositEnabled(state, vault)) {
            return best;
        }

        const vaultApy = getApyPercent(vault.rewardRate.total);

        if (vaultApy === null || !isApyAvailable(vaultApy)) {
            return best;
        }

        if (!best) {
            return vault;
        }

        return (getApyPercent(best.rewardRate.total) ?? 0) >= vaultApy ? best : vault;
    }, null);
