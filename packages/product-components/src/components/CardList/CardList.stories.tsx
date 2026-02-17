import { Meta, StoryObj } from '@storybook/react';

import { Text, getFramePropsStory, getTextPropsStory } from '@trezor/components';

import {
    CardList as CardListComponent,
    allowedCardListFrameProps,
    allowedCardListTextProps,
} from './CardList';

const meta: Meta<typeof CardListComponent> = {
    title: 'CardList',
    component: CardListComponent,
};
export default meta;

export const CardList: StoryObj<typeof CardListComponent> = {
    args: {
        ...getFramePropsStory(allowedCardListFrameProps).args,
        ...getTextPropsStory(allowedCardListTextProps).args,
    },
    argTypes: {
        ...getFramePropsStory(allowedCardListFrameProps).argTypes,
        ...getTextPropsStory(allowedCardListTextProps).argTypes,
    },
    render: props => (
        <CardListComponent {...props}>
            <CardListComponent.Item onClick={() => null}>
                <Text>Account #1</Text>
                <Text intent="neutral" priority="secondary">
                    0.123 BTC
                </Text>
            </CardListComponent.Item>
            <CardListComponent.Item onClick={() => null}>
                <Text>Account #2</Text>
                <Text intent="neutral" priority="secondary">
                    2.005 ETH
                </Text>
            </CardListComponent.Item>
            <CardListComponent.Item onClick={() => null}>
                <Text>Account #3</Text>
                <Text intent="neutral" priority="secondary">
                    0.0001 SOL
                </Text>
            </CardListComponent.Item>
        </CardListComponent>
    ),
};
