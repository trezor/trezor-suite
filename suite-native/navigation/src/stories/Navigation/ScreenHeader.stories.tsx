import type { Meta, StoryObj } from '@storybook/react-native';

import { HStack, IconButton, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';

import { ScreenHeader as ScreenHeaderComponent } from '../../components/ScreenHeader';

const ScreenHeaderCustomContent = () => (
    <HStack alignItems="center">
        <CryptoIcon symbol="btc" size="small" />
        <Text variant="body-md-strong" adjustsFontSizeToFit numberOfLines={1}>
            Bitcoin #1
        </Text>
    </HStack>
);

const meta: Meta<typeof ScreenHeaderComponent> = {
    title: 'Navigation/ScreenHeader',
    component: ScreenHeaderComponent,
    argTypes: {
        title: { control: 'text' },
        closeActionType: { control: 'select', options: ['back', 'close'] },
        customContent: { table: { disable: true } },
        leftIcon: { table: { disable: true } },
        rightIcon: { table: { disable: true } },
        closeAction: { table: { disable: true } },
    },
    parameters: {
        layout: { disablePaddingHorizontal: true },
    },
};

export default meta;

export const ScreenHeader: StoryObj<typeof ScreenHeaderComponent> = {
    name: 'ScreenHeader',
    args: {
        title: 'Screen title',
        closeActionType: 'back',
    },
};

export const ScreenHeaderWithCustomContent: StoryObj<typeof ScreenHeaderComponent> = {
    name: 'ScreenHeader with custom content',
    args: {
        closeActionType: 'back',
        customContent: <ScreenHeaderCustomContent />,
        rightIcon: (
            <IconButton
                intent="neutral"
                priority="secondary"
                size="medium"
                iconName="gear"
                onPress={() => {}}
            />
        ),
    },
    argTypes: {
        title: { table: { disable: true } },
    },
};
