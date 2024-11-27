import { ReactNode } from 'react';

import { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';

import {
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import {
    SkeletonRectangle as SkeletonRectangleComponent,
    SkeletonRectangleProps,
} from './SkeletonRectangle';
import { ElevationContext, ElevationUp, useElevation } from '../ElevationContext/ElevationContext';

const UiBox = styled.div<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBackground};
    border: 1px solid ${mapElevationToBorder};
    padding: ${spacingsPx.sm};
    border-radius: ${borders.radii.sm};
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.sm};
`;

const Box = ({ children }: { children?: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <UiBox $elevation={elevation}>
            <div>Elevation: {elevation}</div>
            <ElevationUp>{children}</ElevationUp>
        </UiBox>
    );
};

const meta: Meta = {
    title: 'Skeletons',
    component: SkeletonRectangleComponent,
} as Meta;
export default meta;

export const SkeletonRectangle: StoryObj<SkeletonRectangleProps> = {
    render: args => (
        <ElevationContext baseElevation={-1}>
            <SkeletonRectangleComponent {...args} />
            <Box>
                <SkeletonRectangleComponent {...args} />
                <Box>
                    <SkeletonRectangleComponent {...args} />
                    <Box>
                        <SkeletonRectangleComponent {...args} />
                    </Box>
                </Box>
            </Box>
        </ElevationContext>
    ),
    args: {
        width: 120,
        height: 20,
        borderRadius: 4,
        animate: true,
    },
};
