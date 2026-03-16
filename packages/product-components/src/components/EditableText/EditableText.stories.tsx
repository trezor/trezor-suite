import { IntlProvider } from 'react-intl';

import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Badge, Box, Button, Column, Icon, Text, getFramePropsStory } from '@trezor/components';
import { spacingsNew } from '@trezor/theme';

import {
    EditableText as EditableTextComponent,
    type EditableTextProps,
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

const StoryWrapper = ({ children }: { children: React.ReactNode }) => (
    <Box
        width="100%"
        maxWidth={400}
        backgroundColor="baseFillElementNeutralSoftest"
        padding={12}
        borderRadius={8}
    >
        {children}
    </Box>
);

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
                <Text typographyStyle="headline-md">
                    <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                </Text>
                <Text typographyStyle="body-md">
                    <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                </Text>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary" align="end">
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
            const result = await new Promise(resolve =>
                setTimeout(() => resolve(value === 'error' ? false : true), 300),
            );

            action('onSubmit')(value);

            return result as boolean;
        },
        onEdit: async () => {
            await new Promise(resolve => setTimeout(resolve));

            action('onEdit')();

            return true;
        },
        onCancel: action('onCancel'),
        isLoading: false,
        isDisabled: false,
        isAlwaysActive: false,
        placeholder: 'Placeholder',
        gap: 8,
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
        isAlwaysActive: {
            control: {
                type: 'boolean',
            },
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
        displayValue: {
            control: {
                type: 'select',
            },
            options: [undefined, 'example'],
            mapping: {
                undefined,
                example: <Text intent="critical">Display value</Text>,
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
