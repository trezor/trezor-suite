import { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { PinInput as PinInputComponent, PinInputProps } from './PinInput';

const meta: Meta = {
    title: 'PinInput',
    component: PinInputComponent,
} as Meta;
export default meta;

const Component = ({ length }: { length: number }) => {
    const [code, setCode] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    return (
        <div>
            <PinInputComponent
                length={length}
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
    render: ({ length }) => <Component length={length} />,
    args: {
        length: 6,
    },
    argTypes: {
        length: {
            control: {
                type: 'number',
            },
        },
    },
};
