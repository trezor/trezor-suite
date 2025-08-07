import { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { InputButton as InputButtonComponent, InputButtonProps } from './InputButton';
import { Icon } from '../../Icon/Icon';
import { iconNames } from '../../Icon/constants';

const meta: Meta = {
    title: 'Form',
    component: InputButtonComponent,
} as Meta;
export default meta;

const Controller = ({ placeholder, icon }: Partial<InputButtonProps>) => {
    const [isExpanded, setExpanded] = useState(false);
    const [value, setValue] = useState('');

    return (
        <InputButtonComponent
            placeholder={placeholder ?? ''}
            icon={icon ?? <Icon name="magnifyingGlass" />}
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
        icon: <Icon name="magnifyingGlass" />,
    },
    argTypes: {
        placeholder: {
            control: {
                type: 'text',
            },
        },
        icon: {
            options: iconNames,
            control: {
                type: 'select',
            },
        },
    },
};
