import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { getTokenName } from '../utils';
import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
};

export const TokenName = ({ networkSymbol, contractAddress, ...props }: TokenNameProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);

    if (!token) return null;

    return (
        <TokenUrlBlur
            {...props}
            text={getTokenName(token.name || token.symbol)}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
        />
    );
};
