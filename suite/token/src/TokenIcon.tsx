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

export const TokenIcon = ({ networkSymbol, contractAddress, ...props }: TokenIconProps) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const isRecognized = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, networkSymbol, contractAddress),
    );
    const name = getTokenDisplayName(token) ?? '';

    return (
        <TokenIconView
            {...props}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            // The tooltip and the image alt show the whole text unmasked, so an unrecognized
            // token gets only its initial.
            placeholder={isRecognized ? name : name.charAt(0)}
            placeholderWithTooltip={isRecognized}
        />
    );
};
