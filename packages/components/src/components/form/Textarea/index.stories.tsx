import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Textarea } from '.';

export default {
    title: 'Form/Textarea',
    args: {
        value: 'Textarea',
        label: 'Label',
        bottomText: '',
        placeholder: '',
        disabled: false,
        monospace: false,
        state: null,
        rows: 5,
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
        rows: {
            control: {
                min: 1,
                max: 30,
                step: 1,
                type: 'range',
            },
        },
    },
};

export const Basic = ({ ...args }) => {
    const [{ value }, updateArgs] = useArgs();
    const handleValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateArgs({ value: e.target.value });
    };

    return (
        <Textarea
            disabled={args.disabled}
            state={args.state}
            label={args.label}
            bottomText={args.bottomText}
            placeholder={args.placeholder}
            monospace={args.monospace}
            rows={args.rows}
            value={value}
            onChange={handleValue}
        />
    );
};
