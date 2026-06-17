import { type Meta, type StoryObj } from '@storybook/react';

import {
    Skeleton as SkeletonComponent,
    type SkeletonProps,
    allowedSkeletonFrameProps,
} from './Skeleton';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof SkeletonComponent> = {
    title: 'Skeleton',
    component: SkeletonComponent,
};
export default meta;

export const Skeleton: StoryObj<SkeletonProps> = {
    args: {
        type: 'rectangle',
        animate: true,
        ...getFramePropsStory(allowedSkeletonFrameProps).args,
    },
    argTypes: {
        type: {
            control: 'select',
            options: ['rectangle', 'circle'],
        },
        size: {
            control: 'number',
        },
        animate: {
            control: 'boolean',
        },
        ...getFramePropsStory(allowedSkeletonFrameProps).argTypes,
    },
};
