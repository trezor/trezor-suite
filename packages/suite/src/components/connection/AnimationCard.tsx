import { PropsWithChildren } from 'react';

import { useTheme } from 'styled-components';

import { Box, FrameProps } from '@trezor/components';

type AnimationCardProps = PropsWithChildren<{
    aspectRatio: FrameProps['aspectRatio'];
    maxHeight?: FrameProps['maxHeight'];
}>;

export const AnimationCard = ({ aspectRatio, maxHeight, children }: AnimationCardProps) => {
    const theme = useTheme();

    return (
        <Box
            borderRadius={16}
            borderWidth={1}
            borderColor={theme.borderOnElevationNegative}
            backgroundColor={theme.backgroundTertiaryDefaultOnElevation0}
            overflow="hidden"
            aspectRatio={aspectRatio}
            maxHeight={maxHeight}
        >
            {children}
        </Box>
    );
};
