import type { ForwardRefExoticComponent, RefAttributes } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import type { Props } from './AutoScalingInput';
import { AutoScalingInput as AutoScalingInputComponent } from './AutoScalingInput';

const meta: Meta = {
    title: '✏️ Form',
    component: AutoScalingInputComponent,
};
export default meta;

export const AutoScalingInput: StoryObj<
    ForwardRefExoticComponent<Omit<Props, 'ref'> & RefAttributes<HTMLInputElement>>
> = {
    render: props => <AutoScalingInputComponent {...props} />,
    args: {
        value: undefined,
        minWidth: 120,
        placeholder: 'Chancellor on the Brink of Second Bailout for Banks',
        disabled: false,
    },
    argTypes: {
        value: {
            control: { type: 'text' },
        },
        minWidth: {
            control: { type: 'number' },
        },
        placeholder: {
            control: { type: 'text' },
        },
        disabled: {
            control: {
                type: 'boolean',
            },
        },
    },
};
