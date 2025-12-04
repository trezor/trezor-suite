import { IntlProvider } from 'react-intl';

import { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { useTheme } from 'styled-components';

import { Badge, Box, Button, Column, Icon, Text, getFramePropsStory } from '@trezor/components';
import { spacingsNew } from '@trezor/theme';

import {
    EditableText as EditableTextComponent,
    EditableTextProps,
    allowedEditableTextFrameProps,
} from './EditableText';

const meta: Meta<typeof EditableTextComponent> = {
    title: 'EditableText',
    decorators: [
        (Story: React.FC) => (
            <IntlProvider locale="en">
                <Story />
            </IntlProvider>
        ),
    ],
    component: EditableTextComponent,
};
export default meta;

const StoryWrapper = ({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();

    return (
        <Box
            width="100%"
            maxWidth={400}
            backgroundColor={theme.baseFillElementNeutralSoftest}
            padding={{ horizontal: 24, top: 12, bottom: 20 }}
            borderRadius={8}
        >
            {children}
        </Box>
    );
};

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
        <StoryWrapper>
            <Column gap={16}>
                <Text typographyStyle="titleMedium">
                    <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                </Text>
                <Text typographyStyle="body">
                    <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                </Text>
            </Column>
        </StoryWrapper>
    ),
    args: {
        children: 'Custom value',
        defaultValue: 'Default value',
        maxWidth: undefined,
        onSubmit: async (value: string) => {
            await new Promise((resolve, reject) =>
                setTimeout(value === 'error' ? reject : resolve, 300),
            );

            action('onSubmit')(value);
        },
        onEdit: action('onEdit'),
        onCancel: action('onCancel'),
        isLoading: false,
        isDisabled: false,
        placeholder: 'Placeholder',
        gap: 6,
        displayValue: <Text variant="destructive">Display value that is very long</Text>,
        ...getFramePropsStory(allowedEditableTextFrameProps).args,
    },
    argTypes: {
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        defaultValue: {
            control: 'text',
        },
        placeholder: {
            control: 'text',
        },
        leftAddon: {
            control: {
                type: 'select',
            },
            options: [undefined, 'example with icon', 'example with text'],
            mapping: {
                undefined,
                'example with icon': <Icon name="tag" size={16} />,
                'example with text': 'Foo:',
            },
        },
        rightAddon: {
            control: {
                type: 'select',
            },
            options: [undefined, 'example with button', 'example with badge'],
            mapping: {
                undefined,
                'example with button': (
                    <Button size="small" priority="secondary" intent="neutral">
                        Copy
                    </Button>
                ),
                'example with badge': <Badge intent="neutral">Taproot</Badge>,
            },
        },
        gap: {
            options: spacingsNew,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedEditableTextFrameProps).argTypes,
    },
};
