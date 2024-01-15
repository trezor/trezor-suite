import { Meta, StoryObj } from '@storybook/react';
import { SkeletonCircle as SkeletonCircleComponent, SkeletonCircleProps } from './SkeletonCircle';

export default {
    title: 'Skeletons/SkeletonCircle',
    component: SkeletonCircleComponent,
} as Meta;

export const SkeletonCircle: StoryObj<SkeletonCircleProps> = {
    args: {
        size: 50,
    },
};
