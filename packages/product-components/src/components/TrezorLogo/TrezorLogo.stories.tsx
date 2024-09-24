import { Meta, StoryObj } from '@storybook/react';
import { TrezorLogoProps, TrezorLogo as TrezorLogoComponent } from './TrezorLogo';

const meta: Meta = {
    title: 'TrezorLogo',
    component: TrezorLogoComponent,
} as Meta;
export default meta;

export const TrezorLogo: StoryObj<TrezorLogoProps> = {
    args: {
        type: 'horizontal',
        width: 100,
    },
    argTypes: {
        type: {
            options: ['horizontal', 'suite_compact', 'suite', 'vertical', 'symbol'],
            control: {
                type: 'radio',
            },
        },
        width: {
            type: 'number',
        },
        height: {
            control: 'number',
        },
    },
};
