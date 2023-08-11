import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Textarea } from './Textarea';

export default {
    title: 'Form/Textarea',
    args: {
        value: 'Textarea',
        label: 'Label',
        bottomText: '',
        placeholder: '',
        disabled: false,
        isMonospace: false,
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

export const Basic = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ value }, updateArgs] = useArgs();
        const handleValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            updateArgs({ value: e.target.value });
        };

        return (
            <Textarea
                disabled={args.disabled}
                inputState={args.state}
                label={args.label}
                bottomText={args.bottomText}
                placeholder={args.placeholder}
                isMonospace={args.isMonospace}
                rows={args.rows}
                value={value}
                onChange={handleValue}
            />
        );
    },
};
