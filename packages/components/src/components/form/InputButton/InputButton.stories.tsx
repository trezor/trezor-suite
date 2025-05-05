import { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { InputButton as InputButtonComponent, InputButtonProps } from './InputButton';
import { variables } from '../../../config';

const meta: Meta = {
    title: 'Form',
    component: InputButtonComponent,
} as Meta;
export default meta;

const Controller = ({ placeholder, iconName }: Partial<InputButtonProps>) => {
    const [isExpanded, setExpanded] = useState(false);
    const [value, setValue] = useState('');

    return (
        <InputButtonComponent
            placeholder={placeholder ?? ''}
            iconName={iconName ?? 'magnifyingGlass'}
            isExpanded={isExpanded}
            value={value}
            setExpanded={setExpanded}
            setValue={setValue}
            onChange={newValue => setValue(newValue)}
        />
    );
};

export const InputButton: StoryObj<typeof InputButtonComponent> = {
    render: props => <Controller {...props} />,
    args: {
        placeholder: 'Token, symbol or contract address',
        iconName: 'magnifyingGlass',
    },
    argTypes: {
        placeholder: {
            control: {
                type: 'text',
            },
        },
        iconName: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
    },
};
