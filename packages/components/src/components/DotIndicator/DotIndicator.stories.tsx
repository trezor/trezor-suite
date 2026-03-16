import { type Meta, type StoryObj } from '@storybook/react';

import { DotIndicator as DotIndicatorComponent } from './DotIndicator';

const meta: Meta<typeof DotIndicatorComponent> = {
    title: 'DotIndicator',
    component: DotIndicatorComponent,
};
export default meta;

export const DotIndicator: StoryObj<typeof meta> = {
    args: {
        isActive: false,
    },
    argTypes: {
        isActive: {
            control: 'boolean',
        },
    },
};
