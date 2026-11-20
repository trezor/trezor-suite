import { type ComponentProps } from 'react';

import { useTokenMetadata } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { TokenIcon as TokenIconView } from '@suite-native/icons';

type TokenIconProps = Omit<ComponentProps<typeof TokenIconView>, 'tokenSymbol'>;

/** Resolves the token's placeholder from metadata at the point where the icon is rendered. */
export const TokenIcon = ({ networkSymbol, contractAddress, ...props }: TokenIconProps) => {
    const token = useTokenMetadata(
        networkSymbol,
        contractAddress ? toTokenAddress(contractAddress) : undefined,
    );

    return (
        <TokenIconView
            {...props}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            tokenSymbol={token?.symbol || token?.name}
        />
    );
};
