import { IntlProvider } from 'react-intl';

import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';

import { Column, Row, Text, getFramePropsStory } from '@trezor/components';

import {
    EditableText as EditableTextComponent,
    EditableTextProps,
    allowedEditableTextFrameProps,
} from './EditableText';

const meta: Meta = {
    title: 'EditableText',
    decorators: [
        (Story: React.FC) => (
            <IntlProvider locale="en">
                <Story />
            </IntlProvider>
        ),
    ],
    component: EditableTextComponent,
} as Meta;
export default meta;

export const EditableText: StoryObj<EditableTextProps> = {
    parameters: {
        docs: {
            description: {
                component: `
                    A text component that can be edited inline.

                    ## Features
                    - Click to edit
                    - Press Enter to save
                    - Press Escape to cancel
                    - Click outside to cancel
                `,
            },
        },
    },
    render: ({ children, ...rest }: EditableTextProps) => (
        <Column>
            <Row gap={4}>
                <Text typographyStyle="body">
                    <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                </Text>{' '}
                <Text typographyStyle="body">Lorem ipsum dolor mucho</Text>
            </Row>
            <Text typographyStyle="titleMedium">
                <EditableTextComponent {...rest}>{children}</EditableTextComponent>
            </Text>
        </Column>
    ),
    args: {
        children: 'hello',
        maxWidth: undefined,
        onSave: action('onSave'),
        isLoading: false,
        isDisabled: false,
        ...getFramePropsStory(allowedEditableTextFrameProps).args,
    },
    argTypes: {
        maxWidth: {
            control: {
                type: 'text',
            },
        },
        ...getFramePropsStory(allowedEditableTextFrameProps).argTypes,
    },
};
