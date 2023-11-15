import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';
import { ChangeEventHandler } from 'react';
import { Textarea as TextareaComponent, TextareaProps } from './Textarea';

export default {
    title: 'Form/Textarea',
    component: TextareaComponent,
} as Meta;

const Component = ({ ...args }) => {
    const [{ value }, updateArgs] = useArgs();

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = e =>
        updateArgs({ value: e.target.value });

    return <TextareaComponent value={value} onChange={handleChange} {...args} />;
};

export const Textarea: StoryObj<TextareaProps> = {
    render: Component,
    args: {
        label: 'Label',
        rows: 5,
        maxLength: 500,
        characterCount: true,
    },
    argTypes: {
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
        labelHoverAddon: {
            control: 'text',
        },
        labelRight: {
            control: 'text',
        },
        bottomText: {
            control: 'text',
        },
        innerRef: {
            control: false,
        },
        value: {
            control: false,
        },
        characterCount: {
            control: 'boolean',
        },
    },
};
