import React from 'react';
import { ComponentStory } from '@storybook/react';

import { Progress } from './Progress';

export default {
    title: 'Loaders/Progress',
    component: Progress,
};

export const Basic: ComponentStory<typeof Progress> = args => <Progress {...args} />;

Basic.args = {
    max: 100,
    value: 21,
};
