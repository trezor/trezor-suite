import { type Meta, type StoryObj } from '@storybook/react';

import { Icon } from '@trezor/components';
import { QrCodeFilledIcon } from '@trezor/icons';

import { QrCode as QrCodeComponent, type QrCodeProps } from './QrCode';

const meta: Meta<QrCodeProps> = {
    title: 'QrCode',
    component: QrCodeComponent,
    args: {
        value: 'https://trezor.io/',
    },
    argTypes: {
        value: { control: 'text' },
        color: {
            control: 'select',
            options: ['contentPrimary', 'contentDefault', 'contentOnPrimary'],
        },
    },
};

export default meta;

export const Default: StoryObj<QrCodeProps> = {};

export const WithCenterIcon: StoryObj<QrCodeProps> = {
    args: {
        centerIcon: <Icon as={QrCodeFilledIcon} size={16} />,
    },
};
