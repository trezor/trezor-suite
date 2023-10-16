import { H1, LoadingContent as LoadingContentComponent } from '../../../index';

export default {
    title: 'Loaders/LoadingContent',
};

export const LoadingContent = {
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
