import { isCryptoIconSymbol } from '@suite-common/icons';

import { NativeTokenIcon } from './NativeTokenIcon';
import { NonNativeTokenIcon } from './NonNativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';

export const TokenIcon = ({ coingeckoId, ...props }: TokenIconProps) => {
    if (coingeckoId) {
        return <NonNativeTokenIcon {...props} coingeckoId={coingeckoId} />;
    }

    return isCryptoIconSymbol(props.symbol) ? <NativeTokenIcon {...props} /> : null;
};
