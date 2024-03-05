import { Meta, StoryObj } from '@storybook/react';
import {
    SkeletonRectangle as SkeletonRectangleComponent,
    SkeletonRectangleProps,
} from './SkeletonRectangle';

const meta: Meta = {
    title: 'Skeletons/SkeletonRectangle',
    component: SkeletonRectangleComponent,
} as Meta;
export default meta;

export const SkeletonRectangle: StoryObj<SkeletonRectangleProps> = {
    args: {
        width: 120,
        height: 20,
        borderRadius: 4,
    },
};
