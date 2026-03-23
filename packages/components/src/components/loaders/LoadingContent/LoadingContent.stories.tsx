import { type Meta, type StoryObj } from '@storybook/react';

import { H1, LoadingContent as LoadingContentComponent } from '../../../index';

const meta: Meta<typeof LoadingContentComponent> = {
    title: 'LoadingContent',
};
export default meta;

export const LoadingContent: StoryObj<typeof meta> = {
    render: ({ ...args }) => (
        <LoadingContentComponent {...args}>
            <H1>$1337</H1>
        </LoadingContentComponent>
    ),
    args: {
        size: 24,
        isLoading: true,
        slideContent: true,
    },
};
