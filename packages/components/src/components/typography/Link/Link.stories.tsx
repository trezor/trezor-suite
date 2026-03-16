import { type Meta, type StoryObj } from '@storybook/react';

import { Link as LinkComponent, type LinkProps, allowedLinkTextProps } from '../../../index';
import { getTextPropsStory } from '../utils';

const meta: Meta<typeof LinkComponent> = {
    title: '🅰️ Typography',
    component: LinkComponent,
};
export default meta;

export const Link: StoryObj<LinkProps> = {
    args: {
        children: 'This is a link.',
        href: 'https://trezor.io',
        ...getTextPropsStory(allowedLinkTextProps).args,
    },
    argTypes: {
        target: {
            control: 'radio',
            options: [null, '_blank', '_self', '_parent', '_top'],
        },
        ...getTextPropsStory(allowedLinkTextProps).argTypes,
    },
};
