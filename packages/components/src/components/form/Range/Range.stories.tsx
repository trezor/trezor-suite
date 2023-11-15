import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Range as RangeComponent, RangeProps } from './Range';

export default {
    title: 'Form/Range',
} as Meta;

export const Range: StoryObj<RangeProps> = {
    render: args => {
        // eslint-disable-next-line
        const [, updateArgs] = useArgs();

        return <RangeComponent {...args} onChange={e => updateArgs({ value: e.target.value })} />;
    },
    args: {
        max: 100,
        min: 0,
        value: 21,
        labels: [
            { component: '0', value: 0 },
            { component: '50', value: 50 },
            { component: '100', value: 100 },
        ],
    },
    argTypes: {
        disabled: {
            control: 'boolean',
        },
        className: {
            control: false,
        },
        onChange: {
            control: false,
        },
    },
};
