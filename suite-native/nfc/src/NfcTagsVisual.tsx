import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NfcTag } from './NfcTag';

const TAG_OVERLAP = 24;

type NfcTagsVisualProps = {
    activeCount?: number;
    totalCount?: number;
    overlapping?: boolean;
};

const rowStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
}));

const overlappingTagStyle = prepareNativeStyle<{ isLast: boolean }>((_, { isLast }) => ({
    marginRight: isLast ? 0 : -TAG_OVERLAP,
}));

export const NfcTagsVisual = ({
    activeCount = 3,
    totalCount = 3,
    overlapping = false,
}: NfcTagsVisualProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(rowStyle)}>
            {Array.from({ length: totalCount }, (_, index) => (
                <View
                    key={index}
                    style={
                        overlapping
                            ? applyStyle(overlappingTagStyle, {
                                  isLast: index === totalCount - 1,
                              })
                            : undefined
                    }
                >
                    <NfcTag testID={`@nfc-tag/${index}`} active={index < activeCount} />
                </View>
            ))}
        </View>
    );
};
