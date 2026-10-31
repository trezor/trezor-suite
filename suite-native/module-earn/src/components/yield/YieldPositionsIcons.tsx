import { useSelector } from 'react-redux';

import {
    type EarnListRootState,
    selectYieldListVaultIcons,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { TokenIcon } from '@suite-native/icons';

import { EarnPositionsCardIcon, MAX_VISIBLE_POSITION_ICONS } from '../earn/EarnPositionsCardIcon';

export const YieldPositionsIcons = () => {
    const { yieldOpportunities } = useYieldOpportunities();

    const vaultIcons = useSelector((state: EarnListRootState) =>
        selectYieldListVaultIcons(state, yieldOpportunities),
    );

    return (
        <>
            {vaultIcons.slice(0, MAX_VISIBLE_POSITION_ICONS).map((vaultIcon, index) => (
                <EarnPositionsCardIcon
                    key={`${vaultIcon.networkSymbol}:${vaultIcon.tokenContractAddress}`}
                    index={index}
                >
                    <TokenIcon
                        networkSymbol={vaultIcon.networkSymbol}
                        tokenSymbol={vaultIcon.tokenSymbol}
                        contractAddress={vaultIcon.tokenContractAddress}
                        size="extraSmall"
                        showNetworkIcon
                        wrappedTokenIcon="network"
                    />
                </EarnPositionsCardIcon>
            ))}
        </>
    );
};
