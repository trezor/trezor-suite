import { useArgs } from '@storybook/client-api';
import { ChangeEventHandler } from 'react';
import { Textarea as TextareaComponent } from './Textarea';

export default {
    title: 'Form/Textarea',
    component: TextareaComponent,
};

const Component = ({ ...args }) => {
    const [{ value }, updateArgs] = useArgs();

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = e =>
        updateArgs({ value: e.target.value });

    return <TextareaComponent value={value} onChange={handleChange} {...args} />;
};

export const Textarea = {
    render: Component,
    args: {
        defaultValue: 'Textarea',
        label: 'Label',
        rows: 5,
        maxLength: 500,
        characterCount: true,
    },
    argTypes: {
        rows: {
            control: {
                min: 1,
                max: 30,
                step: 1,
                type: 'range',
            },
        },
        labelHoverAddon: {
            control: false,
        },
        labelRight: {
            control: false,
        },
        innerRef: {
            control: false,
        },
        wrapperProps: {
            control: false,
        },
        bottomText: {
            control: 'text',
        },
        value: {
            control: false,
        },
        characterCount: {
            control: 'boolean',
        },
    },
};
