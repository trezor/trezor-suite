import { Meta, StoryObj } from '@storybook/react';
import { SkeletonStack as SkeletonStackComponent, SkeletonStackProps } from './SkeletonStack';
import { SkeletonCircle } from './SkeletonCircle';
import { ElevationContext } from '../ElevationContext/ElevationContext';

const meta: Meta = {
    title: 'Skeletons/SkeletonStack',
    component: SkeletonStackComponent,
} as Meta;
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
