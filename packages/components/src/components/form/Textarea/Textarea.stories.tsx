import { ChangeEventHandler } from 'react';

import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import { Textarea as TextareaComponent, TextareaProps } from './Textarea';

const meta: Meta = {
    title: 'Form',
    component: TextareaComponent,
} as Meta;
export default meta;

const Component = ({ ...args }) => {
    const [{ value }, updateArgs] = useArgs();

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = e =>
        updateArgs({ value: e.target.value });

    return <TextareaComponent value={value} onChange={handleChange} {...args} />;
};

export const Textarea: StoryObj<TextareaProps> = {
    render: Component,
    args: {
        isDisabled: false,
        label: 'Label',
        rows: 5,
        maxLength: 500,
        characterCount: true,
    },
    argTypes: {
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        label: {
            control: 'text',
        },
        placeholder: {
            control: 'text',
        },
        rows: {
            control: {
                min: 1,
                max: 30,
                step: 1,
                type: 'range',
            },
        },
        maxLength: {
            control: { type: 'number' },
        },
        labelLeft: {
            control: 'text',
        },
        labelHoverRight: {
            control: 'text',
        },
        labelRight: {
            control: 'text',
        },
        bottomText: {
            control: 'text',
        },
        innerRef: {
            table: {
                type: {
                    summary: 'Ref<HTMLTextAreaElement>',
                },
            },
        },
        value: {
            control: 'text',
        },
        characterCount: {
            control: {
                type: 'object',
            },
            table: {
                type: {
                    summary: 'boolean | { current: number | undefined; max: number }',
                },
            },
        },
        inputState: { control: 'select', options: ['error', 'warning', 'primary'] },
        hasBottomPadding: {
            control: {
                type: 'boolean',
            },
        },
    },
};
