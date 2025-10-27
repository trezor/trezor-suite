import { Meta, StoryObj } from '@storybook/react';

import { TrezorLogo as TrezorLogoComponent, TrezorLogoProps } from './TrezorLogo';

const meta: Meta<typeof TrezorLogoComponent> = {
    title: 'TrezorLogo',
    component: TrezorLogoComponent,
};
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
