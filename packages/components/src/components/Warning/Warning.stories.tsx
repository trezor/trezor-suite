import React from 'react';
import { StoryObj } from '@storybook/react';

import { Warning } from '../../index';

export default {
    title: 'Misc/Warning',
    component: Warning,
};

export const Basic: StoryObj<typeof Warning> = {
    args: {
        children: 'Warning! Here dragons abound. 🐲',
        variant: 'warning',
        withIcon: true,
    },
};

export const Critical: StoryObj<typeof Warning> = {
    args: {
        children: 'Critical! Dragons! Run!',
        variant: 'critical',
        withIcon: true,
    },
};

export const Info: StoryObj<typeof Warning> = {
    args: {
        children: 'Info: Dragons have been spotted in this area.',
        variant: 'info',
        withIcon: true,
    },
};

export const Learn: StoryObj<typeof Warning> = {
    args: {
        children: 'Learn: This variant is used in Guide.',
        variant: 'learn',
        withIcon: true,
    },
};
