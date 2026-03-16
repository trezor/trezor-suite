import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { PinInput as PinInputComponent, type PinInputProps } from './PinInput';

const meta: Meta<typeof PinInputComponent> = {
    title: 'PinInput',
    component: PinInputComponent,
};
export default meta;

export const PinInput: StoryObj<PinInputProps> = {
    args: {
        length: 6,
        isDisabled: false,
        autoFocus: true,
        onChange: action('onChange'),
        onComplete: action('onComplete'),
    },
    argTypes: {
        length: {
            control: 'number',
        },
        isDisabled: {
            control: 'boolean',
        },
        autoFocus: {
            control: 'boolean',
        },
        defaultCode: {
            control: 'text',
        },
    },
};
