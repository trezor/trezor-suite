import type { Meta, StoryObj } from '@storybook/react-native';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { HStack, IconButton, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

import { ScreenHeader as ScreenHeaderComponent } from '../../components/ScreenHeader';

const btcSymbol = asNetworkSymbol('btc');

const ScreenHeaderCustomContent = () => (
    <HStack alignItems="center">
        <TokenIcon symbol={btcSymbol} size="small" />
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
    },
    argTypes: {
        title: { table: { disable: true } },
    },
    render: args => (
        <ScreenHeaderComponent
            {...args}
            customContent={<ScreenHeaderCustomContent />}
            rightIcon={
                <IconButton
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    iconName="gear"
                    onPress={() => {}}
                />
            }
        />
    ),
};
