import { ChangeEvent } from 'react';
import { useArgs } from '@storybook/client-api';

import { Input as InputComponent, InputProps } from './Input';
import { StoryObj } from '@storybook/react';

export default {
    title: 'Form/Input',
    args: {
        value: 'Input',
        label: 'Label',
        bottomText: '',
        isDisabled: false,
        inputState: null,
        variant: null,
    },
    argTypes: {
        labelRight: {
            type: 'string',
        },
        placeholder: {
            type: 'string',
        },
        state: {
            control: {
                options: {
                    'None (default)': null,
                    Success: 'success',
                    Warning: 'warning',
                    Error: 'error',
                },
                type: 'radio',
            },
        },
        variant: {
            control: {
                options: { 'Large (default)': null, Small: 'small' },
                type: 'radio',
            },
        },
    },
};

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
