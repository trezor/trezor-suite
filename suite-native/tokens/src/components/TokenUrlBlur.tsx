import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { BlurUrls, Text, type TextProps } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';

type TokenUrlBlurProps = TextProps & {
    text: string;
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    /** Required when the token name is part of a surrounding Text element. */
    isInline?: boolean;
};

export const TokenUrlBlur = ({
    text,
    networkSymbol,
    contractAddress,
    isInline = false,
    ...textProps
}: TokenUrlBlurProps) => {
    const isRecognized = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, networkSymbol, contractAddress),
    );

    if (isRecognized) return <Text {...textProps}>{text}</Text>;

    return <BlurUrls text={text} isInline={isInline} {...textProps} />;
};
