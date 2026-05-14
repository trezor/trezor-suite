import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '@trezor/components';

import {
    TrezorLogo as TrezorLogoComponent,
    type TrezorLogoProps,
    allowedTrezorLogoFrameProps,
    trezorLogoTypes,
} from './TrezorLogo';

const meta: Meta<typeof TrezorLogoComponent> = {
    title: 'TrezorLogo',
    component: TrezorLogoComponent,
};
export default meta;

export const TrezorLogo: StoryObj<TrezorLogoProps> = {
    args: {
        type: 'horizontal',
        ...getFramePropsStory(allowedTrezorLogoFrameProps).args,
        width: '100px',
    },
    argTypes: {
        type: {
            options: trezorLogoTypes,
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedTrezorLogoFrameProps).argTypes,
    },
};
