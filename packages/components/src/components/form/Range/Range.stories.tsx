import React from 'react';
import { useArgs } from '@storybook/client-api';
import { StoryObj } from '@storybook/react';

import { Range } from './Range';

export default {
    title: 'Form/Range',
    component: Range,
    argTypes: {
        className: {
            control: false,
        },
        onChange: {
            control: false,
        },
    },
};

export const Basic: StoryObj<typeof Range> = {
    render: args => {
        // eslint-disable-next-line
        const [, updateArgs] = useArgs();

        return <Range {...args} onChange={e => updateArgs({ value: e.target.value })} />;
    },

    args: {
        max: 100,
        min: 0,
        value: 21,
    },
};
