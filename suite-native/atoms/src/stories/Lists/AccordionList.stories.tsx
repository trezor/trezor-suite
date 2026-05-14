import type { Meta, StoryObj } from '@storybook/react-native';

import {
    AccordionList as AccordionListComponent,
    type AccordionListProps,
} from '../../Accordion/AccordionList';
import { Text } from '../../Text';

type AccordionListStory = StoryObj<AccordionListProps>;

const meta: Meta<AccordionListProps> = {
    title: 'Atoms/Lists',
    component: AccordionListComponent,
    decorators: [
        (_Story, context) => {
            const { args } = context;

            const textWrappedArgs = {
                ...args,
                items: args.items.map(item => ({
                    ...item,
                    content: <Text variant="body-xs">{item.content}</Text>,
                })),
            };

            return <_Story args={textWrappedArgs} />;
        },
    ],
};

export default meta;

const defaultAccordionItems: AccordionListProps['items'] = [
    {
        title: 'Can I connect my Trezor to Trezor Suite on Mobile?',
        content: `Yes, you can connect your Trezor Safe 7 and use the app to manage your crypto with ease and confidence. For all Trezor devices the app is designed to work as a companion to the desktop/web version of Trezor Suite. As we add more features, it’ll become a standalone mobile application to manage your crypto funds on the go.`,
        iconName: 'trezorSafe7',
    },
    {
        title: 'What is the difference between Portfolio Tracker and Connected Trezor functionality?',
        content:
            'Portfolio Tracker helps you monitor your account balances without having to physically connect your Trezor device. Simply sync your coin addresses and keep track of your crypto on the go. You can also combine coin addresses from multiple wallets or Trezor devices to track your whole portfolio in one place. Connected Trezor allows you to manage your funds protected by your Trezor device. You can verify receive addresses and check your balances and transactions. However, if you disconnect the Trezor, you’ll no longer see the data from the Trezor device.',
        iconName: 'wallet',
    },
    {
        title: 'What are public keys (XPUB) and receive addresses?',
        content:
            'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. For Ethereum, share only your address, while keeping your private key secure.',
        iconName: 'qrCode',
    },
    {
        title: 'My Trezor device can’t connect',
        content:
            'Check the devices are in close proximityMake sure bluetooth is enabled on both devicesRemove old Trezor device Bluetooth connectionsRestart your device(s)Turn Bluetooth on/off again on your mobile deviceForget and re-pair the devicesUpdate Trezor firmware and your mobile device OS',
        iconName: 'cableUsbC',
    },
];

export const AccordionList: AccordionListStory = {
    args: { items: defaultAccordionItems },
    argTypes: {
        items: {
            control: { type: 'object' },
        },
    },
};
