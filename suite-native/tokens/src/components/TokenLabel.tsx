import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenName } from './TokenName';
import { TokenSymbol } from './TokenSymbol';
import { TokenUrlBlur } from './TokenUrlBlur';

type TokenLabelProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    preferred: 'name' | 'symbol';
    isInline?: boolean;
};

/** Prefers the requested label, then the other label, then the contract address. */
export const TokenLabel = ({
    networkSymbol,
    contractAddress,
    preferred,
    ...textProps
}: TokenLabelProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const identity = { networkSymbol, contractAddress };

    if (token?.name && (preferred === 'name' || !token.symbol)) {
        return <TokenName {...textProps} {...identity} />;
    }

    if (token?.symbol) {
        return <TokenSymbol {...textProps} {...identity} />;
    }

    return <TokenUrlBlur {...textProps} {...identity} text={contractAddress} />;
};
