import { StoryWrapper } from '../src/support/Story';

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
