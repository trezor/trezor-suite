import type { Meta, StoryObj } from '@storybook/react-native';

import {
    CollapsibleCard as CollapsibleCardComponent,
    type CollapsibleCardProps,
} from '../../CollapsibleCard/CollapsibleCard';
import { Text } from '../../Text';

type CollapsibleCardStory = StoryObj<CollapsibleCardProps>;

const meta: Meta<CollapsibleCardProps> = {
    title: 'Atoms/CollapsibleCard',
    component: CollapsibleCardComponent,
    render: ({ children, ...rest }) => (
        <CollapsibleCardComponent {...rest}>
            <Text>{children}</Text>
        </CollapsibleCardComponent>
    ),
};

export default meta;

export const CollapsibleCard: CollapsibleCardStory = {
    name: 'CollapsibleCard',
    args: {
        title: 'Pressable title',
        children:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    argTypes: {
        children: {
            control: { type: 'text' },
        },
    },
};
