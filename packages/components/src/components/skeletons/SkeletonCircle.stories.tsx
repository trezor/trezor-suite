import { Meta, StoryObj } from '@storybook/react';
import { SkeletonCircle as SkeletonCircleComponent, SkeletonCircleProps } from './SkeletonCircle';

const meta: Meta = {
    title: 'Skeletons/SkeletonCircle',
    component: SkeletonCircleComponent,
} as Meta;
export default meta;

export const SkeletonCircle: StoryObj<SkeletonCircleProps> = {
    args: {
        size: 50,
    },
};
