import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import type { InputButtonProps } from './InputButton';
import { InputButton as InputButtonComponent } from './InputButton';
import { variables } from '../../../config';

const meta: Meta<typeof InputButtonComponent> = {
    title: '✏️ Form',
    component: InputButtonComponent,
};
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

export const InputButton: StoryObj<typeof meta> = {
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
