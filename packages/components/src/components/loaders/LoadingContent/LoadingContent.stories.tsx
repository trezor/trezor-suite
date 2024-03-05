import { Meta, StoryObj } from '@storybook/react';
import { H1, LoadingContent as LoadingContentComponent, LoadingContentProps } from '../../../index';

const meta: Meta = {
    title: 'Loaders/LoadingContent',
} as Meta;
export default meta;

export const LoadingContent: StoryObj<LoadingContentProps> = {
    render: ({ ...args }) => (
        <LoadingContentComponent {...args}>
            <H1>$1337</H1>
        </LoadingContentComponent>
    ),
    args: {
        size: 20,
        isLoading: true,
    },
};
