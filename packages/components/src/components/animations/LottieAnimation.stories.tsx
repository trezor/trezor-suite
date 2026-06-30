import { type Meta, type StoryObj } from '@storybook/react';

import { shapes } from './AnimationPrimitives';
import { LottieAnimation as LottieAnimationComponent, type LottieType } from './LottieAnimation';

const lottieTypes: LottieType[] = ['BLOCK', 'MEMPOOL', 'MASCOT'];

const meta: Meta<typeof LottieAnimationComponent> = {
    title: 'LottieAnimation',
    component: LottieAnimationComponent,
};
export default meta;

export const LottieAnimation: StoryObj<typeof meta> = {
    args: {
        type: 'MASCOT',
        size: 100,
        loop: true,
        shape: 'ROUNDED',
    },
    argTypes: {
        type: {
            control: {
                type: 'select',
            },
            options: lottieTypes,
        },
        shape: {
            control: {
                type: 'select',
            },
            options: shapes,
        },
        size: {
            control: {
                type: 'number',
            },
        },
        loop: {
            control: {
                type: 'boolean',
            },
        },
    },
};
