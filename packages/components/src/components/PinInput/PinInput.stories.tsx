import { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { PinInput as PinInputComponent, PinInputProps } from './PinInput';

const meta: Meta = {
    title: 'PinInput',
    component: PinInputComponent,
} as Meta;
export default meta;

const Component = ({ ...props }: Omit<PinInputProps, 'onChange' | 'onComplete'>) => {
    const [code, setCode] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    return (
        <div>
            <PinInputComponent
                {...props}
                onChange={value => {
                    setCode(value);
                    setIsComplete(false);
                }}
                onComplete={value => {
                    setCode(value);
                    setIsComplete(true);
                }}
            />
            <span style={isComplete ? { color: 'green' } : undefined}>{code}</span>
        </div>
    );
};

export const PinInput: StoryObj<PinInputProps> = {
    render: Component,
    args: {
        length: 6,
        disabled: false,
        autoFocus: true,
    },
    argTypes: {
        length: {
            control: {
                type: 'number',
            },
        },
        disabled: {
            control: {
                type: 'boolean',
            },
        },
        autoFocus: {
            control: {
                type: 'boolean',
            },
        },
    },
};
