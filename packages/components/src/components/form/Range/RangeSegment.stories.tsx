import { type Meta, type StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import { Range as RangeComponent } from './Range';

const meta: Meta<typeof RangeComponent> = {
    title: '✏️ Form',
};
export default meta;

export const RangeSegment: StoryObj<typeof meta> = {
    render: args => {
        // eslint-disable-next-line
        const [, updateArgs] = useArgs();

        return (
            <RangeComponent
                {...args}
                onChange={e => updateArgs({ value: e.target.value })}
                onLabelClick={value => updateArgs({ value })}
            />
        );
    },
    args: {
        disabled: false,
        labels: [
            { max: 30, value: 'Reward' },
            { max: 100, value: 'Staked' },
        ],
        max: 100,
        min: 0,
        mode: 'segments',
        value: 21,
        fill: true,
    },
    argTypes: {
        disabled: {
            control: {
                type: 'boolean',
            },
        },
        fill: {
            control: {
                type: 'boolean',
            },
        },
        labels: {
            control: {
                type: 'object',
            },
            table: {
                type: {
                    summary: 'Array<{ component: string; value: number }>',
                },
            },
        },
        max: {
            control: {
                type: 'number',
            },
        },
        min: {
            control: {
                type: 'number',
            },
        },
        mode: {
            control: {
                type: 'radio',
            },
            options: ['normal', 'segments'],
        },
        value: {
            control: {
                type: 'number',
            },
        },
        step: {
            control: { type: 'text' },
        },
        className: {
            control: false,
        },
        onChange: {
            control: false,
        },
    },
};
