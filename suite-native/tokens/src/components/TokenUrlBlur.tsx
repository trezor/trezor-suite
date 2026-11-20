import { useSelector } from 'react-redux';

import { useTokenMetadata } from '@suite-common/token';
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
};

export const TokenUrlBlur = ({
    text,
    networkSymbol,
    contractAddress,
    ...textProps
}: TokenUrlBlurProps) => {
    const isDefinitionKnown = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, networkSymbol, contractAddress),
    );
    const tokenMetadata = useTokenMetadata(networkSymbol, contractAddress);

    if (isDefinitionKnown || tokenMetadata?.isRecognized) return <Text {...textProps}>{text}</Text>;

    return <BlurUrls text={text} {...textProps} />;
};
