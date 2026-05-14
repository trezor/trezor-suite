import { type ChangeEvent } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';
import { useArgs } from 'storybook/preview-api';

import { Input as InputComponent, type InputProps, allowedInputFrameProps } from './Input';
import { getFramePropsStory } from '../../../utils/frameProps';
import { inputSizes } from '../types';

const meta: Meta<typeof InputComponent> = {
    title: '✏️ Form',
    args: {
        value: 'Value',
        label: 'Label',
        isDisabled: false,
        size: 'large',
        hasError: false,
        showClearButton: false,
        isMasked: false,
        isClean: false,
        ...getFramePropsStory(allowedInputFrameProps).args,
    },
    argTypes: {
        bottomText: { control: 'text' },
        labelHoverRight: { control: 'text' },
        labelLeft: { control: 'text' },
        labelRight: { control: 'text' },
        leftContent: { control: 'text' },
        rightContent: { control: 'text' },
        placeholder: { control: 'text' },
        size: {
            control: {
                type: 'select',
            },
            options: inputSizes,
        },
        hasError: { control: { type: 'boolean' } },
        showClearButton: {
            control: { type: 'boolean' },
        },
        isMasked: {
            control: { type: 'boolean' },
        },
        isClean: {
            control: { type: 'boolean' },
        },
        ...getFramePropsStory(allowedInputFrameProps).argTypes,
    },
};
export default meta;

export const Input: StoryObj<InputProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ value }, updateArgs] = useArgs();
        const handleValue = (e: ChangeEvent<HTMLInputElement>) => {
            updateArgs({ value: e.target.value });
        };

        return (
            <InputComponent
                value={value}
                onChange={handleValue}
                onClear={() => updateArgs({ value: '' })}
                {...args}
            />
        );
    },
};
