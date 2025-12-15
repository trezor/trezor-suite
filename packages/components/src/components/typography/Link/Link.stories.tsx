import type { Meta, StoryObj } from '@storybook/react';

import type { LinkProps } from '../../../index';
import { Link as LinkComponent, allowedLinkTextProps } from '../../../index';
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
