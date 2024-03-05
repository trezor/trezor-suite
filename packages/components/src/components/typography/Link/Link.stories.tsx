import { Meta, StoryObj } from '@storybook/react';
import { Link as LinkComponent, LinkProps } from '../../../index';

const meta: Meta = {
    title: 'Typography/Link',
    component: LinkComponent,
} as Meta;
export default meta;

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
