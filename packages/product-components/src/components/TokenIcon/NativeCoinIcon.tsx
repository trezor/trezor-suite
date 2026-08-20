import { isNetworkIconSymbol } from '@suite-common/icons';
import {
    getNetworkOptional,
    isNetworkSymbol,
    shouldShowNetworkBadge,
} from '@suite-common/wallet-config';

import { NativeTokenIcon } from './NativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

type NativeCoinIconProps = Pick<
    TokenIconProps,
    | 'symbol'
    | 'size'
    | 'showNetworkIcon'
    | 'showNativeNetworkBadge'
    | 'wrappedTokenIcon'
    | 'data-testid'
>;

export const NativeCoinIcon = ({
    symbol,
    size = 32,
    showNetworkIcon = false,
    showNativeNetworkBadge = false,
    wrappedTokenIcon = 'token',
    'data-testid': dataTestId,
}: NativeCoinIconProps) => {
    if (!showNetworkIcon) {
        return <NativeTokenIcon symbol={symbol} size={size} data-testid={dataTestId} />;
    }

    const settlementSymbol = getNetworkOptional(symbol)?.settlementLayer ?? symbol;
    const hasDistinctSettlementLayer = settlementSymbol !== symbol;
    const isBadgeableTokenNetwork =
        showNativeNetworkBadge && isNetworkSymbol(symbol) && shouldShowNetworkBadge(symbol);
    const showBadge =
        isNetworkIconSymbol(symbol) &&
        (hasDistinctSettlementLayer ||
            wrappedTokenIcon === 'network' ||
            isBadgeableTokenNetwork);

    const icon = <NativeTokenIcon symbol={settlementSymbol} size={size} data-testid={dataTestId} />;

    if (!showBadge) {
        return icon;
    }

    return (
        <NetworkIconBadge networkSymbol={symbol} parentSize={size} data-testid={dataTestId}>
            {icon}
        </NetworkIconBadge>
    );
};
