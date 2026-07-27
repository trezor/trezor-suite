import { useState } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';
import * as yup from 'yup';

import { Card, Column, Text, getFramePropsStory } from '@trezor/components';

import {
    JsonlReader,
    type JsonlReaderProps,
    allowedJsonlReaderFrameProps,
    formatJsonlReaderError,
} from './JsonlReader';

type StoryItem = {
    label: string;
    amount: number;
};

const storyItemSchema = yup.object({
    label: yup.string().required(),
    amount: yup.number().required(),
});

const exampleJsonl = `{"label":"First","amount":1}\n{"label":"Second","amount":2}`;

const JsonlReaderStory = (args: JsonlReaderProps<StoryItem>) => {
    const [loadedData, setLoadedData] = useState<StoryItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>();

    return (
        <Column gap={16} maxWidth="600px">
            <JsonlReader<StoryItem>
                {...args}
                schema={storyItemSchema}
                onDataLoaded={data => {
                    setLoadedData(data);
                    setErrorMessage(undefined);
                }}
                onError={error => {
                    setLoadedData([]);
                    setErrorMessage(formatJsonlReaderError(error));
                }}
            />

            <Card paddingType="small">
                <Column gap={8}>
                    <Text as="div" typographyStyle="body-sm-strong">
                        Example JSONL
                    </Text>
                    <Text as="pre" typographyStyle="body-sm" isMonospaced>
                        {exampleJsonl}
                    </Text>
                </Column>
            </Card>

            <Card paddingType="small">
                <Column gap={8}>
                    <Text as="div" typographyStyle="body-sm-strong">
                        Last result
                    </Text>

                    {errorMessage ? (
                        <Text as="div" intent="critical">
                            {errorMessage}
                        </Text>
                    ) : (
                        <Text as="pre" typographyStyle="body-sm" isMonospaced>
                            {loadedData.length > 0
                                ? JSON.stringify(loadedData, null, 2)
                                : 'Upload a JSONL file to see parsed output.'}
                        </Text>
                    )}
                </Column>
            </Card>
        </Column>
    );
};

const meta: Meta<typeof JsonlReaderStory> = {
    title: 'JsonlReader',
    component: JsonlReaderStory,
};
export default meta;

export const JsonlReaderComponent: StoryObj<typeof meta> = {
    name: 'JsonlReader',
    args: {
        buttonLabel: 'Select JSONL file',
        schema: storyItemSchema,
        isDisabled: false,
        ...getFramePropsStory(allowedJsonlReaderFrameProps).args,
    },
    argTypes: {
        buttonLabel: {
            control: 'text',
        },
        loadingLabel: {
            control: 'text',
        },
        schema: {
            table: {
                disable: true,
            },
        },
        bottomText: {
            control: 'text',
        },
        hasError: {
            control: 'boolean',
        },
        isDisabled: {
            control: 'boolean',
        },
        labelHoverRight: {
            control: 'text',
        },
        labelLeft: {
            control: 'text',
        },
        labelRight: {
            control: 'text',
        },
        onDataLoaded: {
            table: {
                disable: true,
            },
        },
        onError: {
            table: {
                disable: true,
            },
        },
        ...getFramePropsStory(allowedJsonlReaderFrameProps).argTypes,
    },
};
