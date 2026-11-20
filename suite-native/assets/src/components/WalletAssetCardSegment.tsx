import { type ReactNode } from 'react';
import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type WalletAssetCardSegmentProps = {
    children: ReactNode;
    isFirst?: boolean;
    isLast?: boolean;
};

// The virtualized rows can't share one Card, so each cell draws its own slice of the card surface.
// Shadow is omitted because per-cell shadows would show seams between the slices.
const segmentStyle = prepareNativeStyle<Omit<WalletAssetCardSegmentProps, 'children'>>(
    (utils, { isFirst, isLast }) => ({
        backgroundColor: utils.colors.surfaceFillRaised,
        marginHorizontal: utils.spacings.sp16,
        overflow: 'hidden',

        extend: [
            {
                condition: !!isFirst,
                style: {
                    borderTopLeftRadius: utils.borders.radii.r16,
                    borderTopRightRadius: utils.borders.radii.r16,
                },
            },
            {
                condition: !!isLast,
                style: {
                    borderBottomLeftRadius: utils.borders.radii.r16,
                    borderBottomRightRadius: utils.borders.radii.r16,
                },
            },
        ],
    }),
);

export const WalletAssetCardSegment = ({
    children,
    isFirst,
    isLast,
}: WalletAssetCardSegmentProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(segmentStyle, { isFirst, isLast })}>{children}</View>;
};
