import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { BlurUrls, Text, type TextProps } from '@suite-native/atoms';

type TokenNameProps = TextProps & {
    text: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const TokenName = ({ text, networkSymbol, tokenContract, ...textProps }: TokenNameProps) => {
    const isRecognized = useSelector(
        (state: TokenDefinitionsRootState) =>
            tokenContract !== undefined &&
            selectIsSpecificCoinDefinitionKnown(state, networkSymbol, tokenContract),
    );

    if (isRecognized) return <Text {...textProps}>{text}</Text>;

    return <BlurUrls text={text} {...textProps} />;
};
