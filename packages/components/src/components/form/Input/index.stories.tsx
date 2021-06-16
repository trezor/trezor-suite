import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Input } from '.';

export default {
    title: 'Form/Input',
    args: {
        value: 'Input',
        label: 'Label',
        bottomText: '',
        placeholder: '',
        disabled: false,
        monospace: false,
        state: null,
        variant: null,
    },
    argTypes: {
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

export const Basic = ({ ...args }) => {
    const [{ value }, updateArgs] = useArgs();
    const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateArgs({ value: e.target.value });
    };

    return (
        <Input
            disabled={args.disabled}
            state={args.state}
            variant={args.variant}
            label={args.label}
            bottomText={args.bottomText}
            placeholder={args.placeholder}
            monospace={args.monospace}
            value={value}
            onChange={handleValue}
        />
    );
};
