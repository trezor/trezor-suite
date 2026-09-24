import { TokenIcon } from '@suite-native/icons';

import { type YieldListVaultIcon } from '../../types';
import { EarnPositionsCardIcon, MAX_VISIBLE_POSITION_ICONS } from '../earn/EarnPositionsCardIcon';

type YieldPositionsIconsProps = {
    vaultIcons: YieldListVaultIcon[];
};

export const YieldPositionsIcons = ({ vaultIcons }: YieldPositionsIconsProps) => (
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
