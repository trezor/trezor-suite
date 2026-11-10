import { type TokenAddress } from '@suite-common/tokens';
import {
    TokenIcon as NetworkIcon,
    type TokenIconProps as NetworkIconProps,
} from '@trezor/product-components';

import { TokenIcon } from './TokenIcon';

type AssetIconProps = Omit<
    NetworkIconProps,
    'contractAddress' | 'placeholder' | 'placeholderWithTooltip'
> & {
    contractAddress?: TokenAddress;
};

/** The icon of a token, resolved from its metadata, or of the network's coin. */
export const AssetIcon = ({ contractAddress, ...props }: AssetIconProps) => {
    if (contractAddress) return <TokenIcon {...props} contractAddress={contractAddress} />;

    return <NetworkIcon {...props} />;
};
