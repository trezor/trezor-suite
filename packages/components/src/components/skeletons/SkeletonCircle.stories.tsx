import { Meta, StoryObj } from '@storybook/react';

import { SkeletonCircle as SkeletonCircleComponent, SkeletonCircleProps } from './SkeletonCircle';

const meta: Meta<typeof SkeletonCircleComponent> = {
    title: 'Skeletons',
    component: SkeletonCircleComponent,
};
export default meta;

export const SkeletonCircle: StoryObj<SkeletonCircleProps> = {
    args: {
        size: 50,
    },
};
