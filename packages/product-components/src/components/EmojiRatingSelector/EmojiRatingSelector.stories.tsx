import { useEffect, useState } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { type Rating } from '@suite-common/feedback';
import { Card, Column, Text } from '@trezor/components';

import {
    EmojiRatingSelector as EmojiRatingSelectorComponent,
    type EmojiRatingSelectorProps,
} from './EmojiRatingSelector';

const EmojiRatingSelectorStory = ({
    value: initialValue,
    onChange,
    ...args
}: EmojiRatingSelectorProps) => {
    const [value, setValue] = useState<Rating | undefined>(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleChange = (rating: Rating) => {
        setValue(rating);
        onChange(rating);
    };

    return (
        <Card paddingType="small">
            <Column gap={12} alignItems="start">
                <EmojiRatingSelectorComponent {...args} value={value} onChange={handleChange} />

                <Text typographyStyle="body-sm" intent="neutral">
                    Selected rating: {value ?? 'none'}
                </Text>
            </Column>
        </Card>
    );
};

const meta: Meta<typeof EmojiRatingSelectorComponent> = {
    title: 'EmojiRatingSelector',
    component: EmojiRatingSelectorComponent,
    parameters: {
        docs: {
            description: {
                component:
                    'Standalone emoji-based rating selector used by feedback flows across Suite.',
            },
        },
    },
    argTypes: {
        value: {
            control: {
                type: 'select',
            },
            options: [undefined, '1', '2', '3', '4', '5'],
        },
        onChange: {
            table: {
                disable: true,
            },
        },
    },
};

export default meta;

export const EmojiRatingSelector: StoryObj<typeof EmojiRatingSelectorComponent> = {
    args: {
        value: undefined,
        onChange: action('onChange'),
        'data-testid': '@storybook/emoji-rating-selector',
    },
    render: args => <EmojiRatingSelectorStory {...args} />,
};
