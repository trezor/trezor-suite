import { useSelector } from 'react-redux';

import { TokenIcon } from '@suite-native/icons';

import { selectStakingListSymbols } from '../../earnScreenSelectors';
import { EarnPositionsCardIcon, MAX_VISIBLE_POSITION_ICONS } from '../earn/EarnPositionsCardIcon';

export const StakingPositionsIcons = () => {
    const symbols = useSelector(selectStakingListSymbols);

    return (
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
};
