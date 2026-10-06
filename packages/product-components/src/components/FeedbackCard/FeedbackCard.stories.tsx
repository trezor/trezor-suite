import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { FeedbackCard as FeedbackCardComponent } from './FeedbackCard';

type StoryArgs = {
    heading: string;
    description: string;
    submitLabel: string;
    cancelLabel: string;
    successHeading: string;
    successDescription: string;
};

const meta: Meta<StoryArgs> = {
    title: 'FeedbackCard',
    parameters: {
        docs: {
            description: {
                component:
                    'Inline feedback card showing a heading and an emoji rating selector, which wrap onto separate lines when they no longer fit side by side. Picking a rating opens the feedback form in a modal; cancelling it clears the rating and the text. Used in trade and yield completion screens.',
            },
        },
    },
};

export default meta;

const defaultArgs: StoryArgs = {
    heading: 'Rate your Stablecoin Yield experience',
    description: "Tell us what's working and what's not—we read every reply.",
    submitLabel: 'Send feedback',
    cancelLabel: 'Cancel',
    successHeading: 'Thank you for your feedback!',
    successDescription: "We'll use it to improve your experience.",
};

export const Default: StoryObj<StoryArgs> = {
    args: defaultArgs,
    argTypes: {
        heading: { control: 'text' },
        description: { control: 'text' },
        submitLabel: { control: 'text' },
        cancelLabel: { control: 'text' },
        successHeading: { control: 'text' },
        successDescription: { control: 'text' },
    },
    render: ({
        heading,
        description,
        submitLabel,
        cancelLabel,
        successHeading,
        successDescription,
    }) => (
        <FeedbackCardComponent
            heading={heading}
            description={description}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            successHeading={successHeading}
            successDescription={successDescription}
            onSubmit={action('onSubmit')}
        />
    ),
};

export const Success: StoryObj<StoryArgs> = {
    args: defaultArgs,
    render: ({
        heading,
        description,
        submitLabel,
        cancelLabel,
        successHeading,
        successDescription,
    }) => (
        <FeedbackCardComponent
            heading={heading}
            description={description}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            successHeading={successHeading}
            successDescription={successDescription}
            onSubmit={action('onSubmit')}
            defaultView="success"
        />
    ),
};
