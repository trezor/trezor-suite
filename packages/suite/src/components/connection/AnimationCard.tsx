import { type PropsWithChildren } from 'react';

import { Box, type FrameProps } from '@trezor/components';

type AnimationCardProps = PropsWithChildren<{
    aspectRatio: FrameProps['aspectRatio'];
    maxHeight?: FrameProps['maxHeight'];
}>;

export const AnimationCard = ({ aspectRatio, maxHeight, children }: AnimationCardProps) => (
    <Box
        borderRadius={16}
        borderWidth={1}
        borderColor="borderOnElevationNegative"
        backgroundColor="backgroundTertiaryDefaultOnElevation0"
        overflow="hidden"
        aspectRatio={aspectRatio}
        maxHeight={maxHeight}
    >
        {children}
    </Box>
);
