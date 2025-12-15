import type { Meta, StoryObj } from '@storybook/react';

import type { SkeletonCircleProps } from './SkeletonCircle';
import { SkeletonCircle as SkeletonCircleComponent } from './SkeletonCircle';

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
