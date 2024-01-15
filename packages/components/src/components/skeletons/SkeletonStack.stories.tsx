import { Meta, StoryObj } from '@storybook/react';
import { SkeletonStack as SkeletonStackComponent, SkeletonStackProps } from './SkeletonStack';
import { SkeletonCircle } from './SkeletonCircle';

export default {
    title: 'Skeletons/SkeletonStack',
    component: SkeletonStackComponent,
} as Meta;

export const SkeletonStack: StoryObj<SkeletonStackProps> = {
    render: args => (
        <SkeletonStackComponent {...args}>
            <SkeletonCircle size={50} />
            <SkeletonCircle size={50} />
            <SkeletonCircle size={50} />
        </SkeletonStackComponent>
    ),
    args: {
        col: true,
        grow: true,
        margin: '20px',
        childMargin: '20px',
        alignItems: 'center',
    },
};
