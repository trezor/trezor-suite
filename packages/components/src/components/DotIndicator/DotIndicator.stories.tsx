import { Meta, StoryObj } from '@storybook/react';

import { DotIndicator as DotIndicatorComponent } from './DotIndicator';

const meta = {
    title: 'DotIndicator',
    component: DotIndicatorComponent,
} as Meta;
export default meta;

export const DotIndicator: StoryObj = {
    args: {
        isActive: false,
    },
    argTypes: {
        isActive: {
            control: 'boolean',
        },
    },
};
