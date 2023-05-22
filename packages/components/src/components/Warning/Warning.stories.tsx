import React from 'react';
import { ComponentStory } from '@storybook/react';

import { Warning } from '../../index';

export default {
    title: 'Misc/Warning',
};

export const Basic: ComponentStory<typeof Warning> = args => <Warning {...args} />;
export const Critical: ComponentStory<typeof Warning> = args => <Warning {...args} />;
export const Info: ComponentStory<typeof Warning> = args => <Warning {...args} />;
export const Learn: ComponentStory<typeof Warning> = args => <Warning {...args} />;

Basic.args = {
    children: 'Warning! Here dragons abound. 🐲',
    variant: 'warning',
    withIcon: true,
};
Critical.args = {
    children: 'Critical! Dragons! Run!',
    variant: 'critical',
    withIcon: true,
};
Info.args = {
    children: 'Info: Dragons have been spotted in this area.',
    variant: 'info',
    withIcon: true,
};
Learn.args = {
    children: 'Learn: This variant is used in Guide.',
    variant: 'learn',
    withIcon: true,
};
