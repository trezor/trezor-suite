import type { Meta, StoryObj } from '@storybook/react-native';

import { BlurUrls } from '../BlurUrls/BlurUrls';

const meta: Meta<typeof BlurUrls> = {
    title: 'Atoms/BlurUrls',
    component: BlurUrls,
    args: {
        text: 'Claim at rewards.example now',
        numberOfLines: 1,
        ellipsizeMode: 'tail',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const TokenName: Story = {};

export const UrlAtStart: Story = {
    args: { text: 'rewards.example Claim now' },
};

export const LongName: Story = {
    args: { text: 'Claim at rewards.example/very/long/token/reward/address now' },
};

export const MultipleUrls: Story = {
    args: { text: 'Visit first.example or second.example now' },
};
