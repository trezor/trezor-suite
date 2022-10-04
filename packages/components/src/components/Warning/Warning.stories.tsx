import React from 'react';
import { ComponentStory } from '@storybook/react';

import { Warning } from '../../index';

export default {
    title: 'Misc/Warning',
};

export const Basic: ComponentStory<typeof Warning> = args => <Warning {...args} />;

Basic.args = {
    children: 'Warning! Here dragons abound. 🐲',
    critical: false,
    withIcon: true,
};
