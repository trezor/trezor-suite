import { StoryWrapper } from '@trezor/components';

export const decorators = [
    (Story, context) =>
        context?.parameters?.noWrapper ? (
            <Story />
        ) : (
            <StoryWrapper>
                <Story />
            </StoryWrapper>
        ),
];
export const parameters = {
    options: {
        showPanel: true,
        showInfo: true,
        panelPosition: 'right',
    },
    theme: {
        base: 'light',
    },
};
