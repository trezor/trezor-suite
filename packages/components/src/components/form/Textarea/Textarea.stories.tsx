import { type ChangeEventHandler } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import { Textarea as TextareaComponent, allowedTextareaFrameProps } from './Textarea';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta<typeof TextareaComponent> = {
    title: '✏️ Form',
    component: TextareaComponent,
};
export default meta;

const Component = ({ ...args }) => {
    const [{ value }, updateArgs] = useArgs();

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = e =>
        updateArgs({ value: e.target.value });

    return <TextareaComponent value={value} onChange={handleChange} {...args} />;
};

export const Textarea: StoryObj<typeof meta> = {
    render: Component,
    args: {
        isDisabled: false,
        hasError: false,
        label: 'Label',
        rows: 5,
        maxLength: 500,
        characterCount: true,
        ...getFramePropsStory(allowedTextareaFrameProps).args,
    },
    argTypes: {
        isDisabled: {
            control: 'boolean',
        },
        hasError: { control: 'boolean' },
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
        ...getFramePropsStory(allowedTextareaFrameProps).argTypes,
    },
};
