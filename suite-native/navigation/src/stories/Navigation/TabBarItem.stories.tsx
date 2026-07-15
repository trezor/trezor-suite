import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { Box } from '@suite-native/atoms';
import { ICON_NAMES } from '@suite-native/icons';

import { TabBarItem as TabBarItemComponent } from '../../components/TabBarItem';

const meta: Meta<typeof TabBarItemComponent> = {
    title: 'Navigation/Tabs',
    component: TabBarItemComponent,
    decorators: [
        Story => {
            const [args, updateArgs] = useArgs();

            return (
                // TabBarItem uses `flex: 1`. A row wrapper lets it fill the fixed width on the main
                // axis while its height stays content-driven (like it does inside the real tab bar).
                <Box style={{ width: 100, flexDirection: 'row' }}>
                    <Story
                        args={{
                            ...args,
                            onPress: () => {
                                updateArgs({ isFocused: !args.isFocused });
                            },
                        }}
                    />
                </Box>
            );
        },
    ],
    args: {
        isFocused: false,
        title: 'Home',
        iconName: 'house',
        focusedIconName: 'houseFilled',
    },
    argTypes: {
        isFocused: {
            control: { type: 'boolean' },
        },
        title: {
            control: { type: 'text' },
        },
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        focusedIconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        onPress: { table: { disable: true } },
        testID: { table: { disable: true } },
    },
};

export default meta;

export const TabBarItem: StoryObj<typeof TabBarItemComponent> = {
    name: 'TabBarItem',
};
