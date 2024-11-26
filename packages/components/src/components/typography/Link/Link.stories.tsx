import { Meta, StoryObj } from '@storybook/react';

import { allowedLinkTextProps, Link as LinkComponent, LinkProps } from '../../../index';
import { getTextPropsStory } from '../utils';

const meta: Meta = {
    title: 'Typography',
    component: LinkComponent,
} as Meta;
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
