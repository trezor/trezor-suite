import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
};

export const TokenName = ({ networkSymbol, contractAddress, ...props }: TokenNameProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const name = token?.name || token?.symbol || null;

    if (name === null) return null;

    return (
        <TokenUrlBlur
            {...props}
            text={name}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
        />
    );
};
