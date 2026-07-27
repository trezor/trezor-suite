import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { FeedbackCard as FeedbackCardComponent } from './FeedbackCard';

type StoryArgs = {
    heading: string;
    description: string;
    submitLabel: string;
    successHeading: string;
    successDescription: string;
};

const meta: Meta<StoryArgs> = {
    title: 'FeedbackCard',
    parameters: {
        docs: {
            description: {
                component:
                    'Inline feedback card with emoji rating selector, textarea, and a success view after submission. Used in trade and yield completion screens.',
            },
        },
    },
};

export default meta;

const defaultArgs: StoryArgs = {
    heading: 'Rate your Stablecoin Yield experience',
    description: "Tell us what's working and what's not—we read every reply.",
    submitLabel: 'Submit',
    successHeading: 'Thank you for your feedback!',
    successDescription: "We'll use it to improve your experience.",
};

export const Default: StoryObj<StoryArgs> = {
    args: defaultArgs,
    argTypes: {
        heading: { control: 'text' },
        description: { control: 'text' },
        submitLabel: { control: 'text' },
        successHeading: { control: 'text' },
        successDescription: { control: 'text' },
    },
    render: ({ heading, description, submitLabel, successHeading, successDescription }) => (
        <FeedbackCardComponent
            heading={heading}
            description={description}
            submitLabel={submitLabel}
            successHeading={successHeading}
            successDescription={successDescription}
            onSubmit={action('onSubmit')}
        />
    ),
};

export const Success: StoryObj<StoryArgs> = {
    args: defaultArgs,
    render: ({ heading, description, submitLabel, successHeading, successDescription }) => (
        <FeedbackCardComponent
            heading={heading}
            description={description}
            submitLabel={submitLabel}
            successHeading={successHeading}
            successDescription={successDescription}
            onSubmit={action('onSubmit')}
            defaultView="success"
        />
    ),
};
