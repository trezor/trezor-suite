import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { BlurUrls, DiscreetText, Text, type TextProps } from '@suite-native/atoms';

type TokenNameProps = TextProps & {
    text: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
};

export const TokenName = ({
    text,
    networkSymbol,
    tokenContract,
    isDiscreetText = false,
    isForcedDiscreetMode,
    ...textProps
}: TokenNameProps) => {
    const isRecognized = useSelector(
        (state: TokenDefinitionsRootState) =>
            tokenContract !== undefined &&
            selectIsSpecificCoinDefinitionKnown(state, networkSymbol, tokenContract),
    );

    if (isDiscreetText) {
        return (
            <DiscreetText
                shouldBlurUrls={!isRecognized}
                isForcedDiscreetMode={isForcedDiscreetMode}
                {...textProps}
            >
                {text}
            </DiscreetText>
        );
    }

    if (isRecognized) return <Text {...textProps}>{text}</Text>;

    return <BlurUrls text={text} {...textProps} />;
};
