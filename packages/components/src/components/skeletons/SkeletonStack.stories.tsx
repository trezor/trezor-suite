import { type Meta, type StoryObj } from '@storybook/react';

import { SkeletonCircle } from './SkeletonCircle';
import { SkeletonStack as SkeletonStackComponent, type SkeletonStackProps } from './SkeletonStack';
import { ElevationContext } from '../ElevationContext/ElevationContext';

const meta: Meta<typeof SkeletonStackComponent> = {
    title: 'Skeletons',
    component: SkeletonStackComponent,
};
export default meta;

export const SkeletonStack: StoryObj<SkeletonStackProps> = {
    render: args => (
        <SkeletonStackComponent {...args}>
            <ElevationContext baseElevation={1}>
                <SkeletonCircle size={50} />
                <SkeletonCircle size={50} />
                <SkeletonCircle size={50} />
            </ElevationContext>
        </SkeletonStackComponent>
    ),
    args: {
        $col: true,
        $grow: true,
        $margin: '20px',
        $childMargin: '20px',
        $alignItems: 'center',
    },
};
