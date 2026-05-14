import type { Meta, StoryObj } from '@storybook/react-native';

import { Divider as DividerComponent, type DividerProps } from '../../Divider';
import { VStack } from '../../Stack';
import { Text } from '../../Text';

type DividerStory = StoryObj<DividerProps>;

const meta: Meta<DividerProps> = {
    title: 'Atoms/Dividers',
    component: DividerComponent,
    render: args => (
        <VStack alignItems="center">
            <Text>Text above the divider</Text>
            <DividerComponent {...args} style={{ backgroundColor: '#afb3b9', width: '100%' }} />
            <Text>Text below the divider</Text>
        </VStack>
    ),
};

export default meta;

export const Divider: DividerStory = {
    name: 'Divider',
};
