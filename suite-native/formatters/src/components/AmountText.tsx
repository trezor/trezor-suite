import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    BlurUrls,
    DiscreetText,
    Text,
    type TextProps,
    resetLetterSpacingOnAndroidStyle,
} from '@suite-native/atoms';
import { mergeNativeStyleObjects, useNativeStyles } from '@trezor/styles-native';

import { TokenName } from './TokenName';

type AmountTextProps = {
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
    shouldBlurUrls?: boolean;
    value: string | null;
    token?: {
        networkSymbol: NetworkSymbol;
        tokenContract?: TokenAddress;
    };
} & TextProps;

export const AmountText = ({
    value,
    isDiscreetText = true,
    shouldBlurUrls = false,
    token,
    style = {},
    ...otherProps
}: AmountTextProps) => {
    const { applyStyle } = useNativeStyles();

    const textProps = {
        style: mergeNativeStyleObjects([style, applyStyle(resetLetterSpacingOnAndroidStyle)]),
        ...otherProps,
    };

    if (token !== undefined && value !== null) {
        return <TokenName text={value} {...token} isDiscreetText={isDiscreetText} {...textProps} />;
    }

    if (isDiscreetText) {
        return (
            <DiscreetText shouldBlurUrls={shouldBlurUrls} {...textProps}>
                {value}
            </DiscreetText>
        );
    }

    if (shouldBlurUrls && value !== null) {
        return <BlurUrls text={value} {...textProps} />;
    }

    return <Text {...textProps}>{value}</Text>;
};
