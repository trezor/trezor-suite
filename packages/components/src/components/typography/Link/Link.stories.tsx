import { Meta, StoryObj } from '@storybook/react';
import { Link as LinkComponent, LinkProps } from '../../../index';

export default {
    title: 'Typography/Link',
    component: LinkComponent,
} as Meta;

export const Link: StoryObj<LinkProps> = {
    args: {
        children: 'This is a link.',
        href: 'https://trezor.io',
    },
    argTypes: {
        target: {
            control: 'radio',
            options: [null, '_blank', '_self', '_parent', '_top'],
        },
    },
};
