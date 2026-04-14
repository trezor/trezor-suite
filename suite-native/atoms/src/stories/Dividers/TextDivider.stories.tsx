import { View } from 'react-native';

import { type Meta, type StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS } from '@trezor/theme';

import { VStack } from '../../Stack';
import { Text } from '../../Text';
import { TextDivider as TextDividerComponent, type TextDividerProps } from '../../TextDivider';

type TextDividerStory = StoryObj<TextDividerProps>;

const meta: Meta<TextDividerProps> = {
    title: 'Atoms/Dividers',
    component: TextDividerComponent,
    render: args => (
        <VStack alignItems="center">
            <Text>Text above the divider</Text>
            <View style={{ width: '100%' }}>
                <TextDividerComponent {...args} />
            </View>
            <Text>Text below the divider</Text>
        </VStack>
    ),
};

export default meta;

export const TextDivider: TextDividerStory = {
    name: 'Text Divider',
    args: {
        lineColor: 'contentPrimary',
        textColor: 'contentPrimary',
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        horizontalMargin: {
            control: { type: 'number' },
        },
        lineColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        textColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
    },
};
