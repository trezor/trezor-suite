import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TokenIcon } from '@suite-native/icons';

import { EarnPositionsCardIcon, MAX_VISIBLE_POSITION_ICONS } from '../earn/EarnPositionsCardIcon';

type StakingPositionsIconsProps = {
    symbols: NetworkSymbol[];
};

export const StakingPositionsIcons = ({ symbols }: StakingPositionsIconsProps) => (
    <>
        {symbols.slice(0, MAX_VISIBLE_POSITION_ICONS).map((symbol, index) => (
            <EarnPositionsCardIcon key={symbol} index={index}>
                <TokenIcon
                    networkSymbol={symbol}
                    tokenSymbol={symbol}
                    size="extraSmall"
                    showNetworkIcon
                    wrappedTokenIcon="token"
                />
            </EarnPositionsCardIcon>
        ))}
    </>
);
