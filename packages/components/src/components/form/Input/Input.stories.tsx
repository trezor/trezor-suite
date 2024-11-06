import { ChangeEvent } from 'react';

import { useArgs } from '@storybook/client-api';
import { Meta, StoryObj } from '@storybook/react';

import {
    Input as InputComponent,
    InputProps,
    allowedInputFrameProps,
    allowedInputTextProps,
} from './Input';
import { getFramePropsStory } from '../../../utils/frameProps';
import { getTextPropsStory } from '../../typography/utils';

const meta: Meta = {
    title: 'Form',
    args: {
        value: 'Input',
        label: 'Label',
        isDisabled: false,
        size: 'large',
        inputState: null,
        innerAddonAlign: 'right',
        hasBottomPadding: true,
        ...getFramePropsStory(allowedInputFrameProps).args,
        ...getTextPropsStory(allowedInputTextProps).args,
    },
    argTypes: {
        bottomText: { control: 'text' },
        labelHoverRight: { control: 'text' },
        labelLeft: { control: 'text' },
        labelRight: { control: 'text' },
        innerAddon: { control: 'text' },
        placeholder: { control: 'text' },
        size: {
            control: {
                type: 'radio',
            },
            options: ['large', 'small'],
        },
        inputState: {
            control: {
                type: 'radio',
            },
            options: [null, 'warning', 'error'],
        },
        innerAddonAlign: {
            control: {
                type: 'radio',
            },
            options: ['right', 'left'],
        },
        showClearButton: {
            control: {
                type: 'radio',
            },
            options: [null, 'hover', 'always'],
        },
        ...getFramePropsStory(allowedInputFrameProps).argTypes,
        ...getTextPropsStory(allowedInputTextProps).argTypes,
    },
} as Meta;
export default meta;

export const Input: StoryObj<InputProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ value }, updateArgs] = useArgs();
        const handleValue = (e: ChangeEvent<HTMLInputElement>) => {
            updateArgs({ value: e.target.value });
        };

        return <InputComponent value={value} onChange={handleValue} {...args} />;
    },
};
