import { useSelector } from 'react-redux';

import { getTokenDisplayName, useTokenMetadata } from '@suite-common/token';
import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import {
    TokenIcon as TokenIconView,
    type TokenIconProps as TokenIconViewProps,
} from '@trezor/product-components';

type TokenIconProps = Omit<
    TokenIconViewProps,
    'contractAddress' | 'placeholder' | 'placeholderWithTooltip'
> & {
    contractAddress: TokenAddress;
};

/** Resolves the placeholder from the token's metadata where the icon is rendered. */
export const TokenIcon = ({ symbol, contractAddress, ...props }: TokenIconProps) => {
    const token = useTokenMetadata(symbol, contractAddress);
    const isRecognized = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, symbol, contractAddress),
    );
    const name = getTokenDisplayName(token) ?? '';

    return (
        <TokenIconView
            {...props}
            symbol={symbol}
            contractAddress={contractAddress}
            // The tooltip and the image alt show the whole text unmasked, so an unrecognized
            // token gets only its initial.
            placeholder={isRecognized ? name : name.charAt(0)}
            placeholderWithTooltip={isRecognized}
        />
    );
};
