import { type Meta, type StoryObj } from '@storybook/react';

import {
    SkeletonCircle as SkeletonCircleComponent,
    type SkeletonCircleProps,
} from './SkeletonCircle';

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
