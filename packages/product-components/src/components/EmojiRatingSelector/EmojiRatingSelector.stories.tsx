import { useEffect, useState } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Card, Column, Text } from '@trezor/components';

import {
    EmojiRatingSelector as EmojiRatingSelectorComponent,
    type EmojiRatingSelectorOption,
    type EmojiRatingSelectorProps,
} from './EmojiRatingSelector';

type ExampleValue = 'negative' | 'neutral' | 'positive';

const exampleOptions: ReadonlyArray<EmojiRatingSelectorOption<ExampleValue>> = [
    { id: 'negative', emoji: '🙁' },
    { id: 'neutral', emoji: '😐' },
    { id: 'positive', emoji: '🙂' },
];

const EmojiRatingSelectorStory = ({
    value: initialValue,
    onChange,
    ...args
}: EmojiRatingSelectorProps<ExampleValue>) => {
    const [value, setValue] = useState<ExampleValue | undefined>(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleChange = (selectedValue: ExampleValue) => {
        setValue(selectedValue);
        onChange(selectedValue);
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

const meta: Meta<EmojiRatingSelectorProps<ExampleValue>> = {
    title: 'EmojiRatingSelector',
    component: EmojiRatingSelectorComponent<ExampleValue>,
    parameters: {
        docs: {
            description: {
                component: 'Generic emoji selector with caller-defined values and emoji options.',
            },
        },
    },
    argTypes: {
        value: {
            control: {
                type: 'select',
            },
            options: [undefined, ...exampleOptions.map(({ id }) => id)],
        },
        onChange: {
            table: {
                disable: true,
            },
        },
    },
};

export default meta;

export const EmojiRatingSelector: StoryObj<EmojiRatingSelectorProps<ExampleValue>> = {
    args: {
        value: undefined,
        options: exampleOptions,
        onChange: action('onChange'),
        'data-testid': '@storybook/emoji-rating-selector',
    },
    render: args => <EmojiRatingSelectorStory {...args} />,
};
