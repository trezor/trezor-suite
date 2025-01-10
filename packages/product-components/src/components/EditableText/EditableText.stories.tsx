import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Column, Row, Text } from '@trezor/components';

import { EditableText as EditableTextComponent, EditableTextProps } from './EditableText';

const meta: Meta = {
    title: 'EditableText',
    component: EditableTextComponent,
} as Meta;
export default meta;

export const EditableText: StoryObj<EditableTextProps> = {
    render: ({ children, ...rest }: EditableTextProps) => {
        return (
            <Column>
                <Row gap={4}>
                    <Text typographyStyle="body">
                        <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                    </Text>{' '}
                    <Text typographyStyle="body">hasljlas kasdj lsdljdsf l dsfjl</Text>
                </Row>
                <Text typographyStyle="titleMedium">
                    <EditableTextComponent {...rest}>{children}</EditableTextComponent>
                </Text>
            </Column>
        );
    },
    args: {
        children: 'hello',
        maxWidth: undefined,
        onSave: action('onSave'),
        isLoading: false,
        isDisabled: false,
        textLoading: 'Loading',
    },
    argTypes: {
        maxWidth: {
            control: {
                type: 'text',
            },
        },
    },
};
