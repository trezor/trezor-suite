import { type Meta, type StoryObj } from '@storybook/react';

import { asNetworkSymbol } from '@trezor/network-module-types';
import { spacingValues } from '@trezor/theme';

import {
    NetworkIconSet as NetworkIconSetComponent,
    type NetworkIconSetProps,
} from './NetworkIconSet';
import { NetworkDisplayProvider } from '../../network-display/NetworkDisplayProvider';
import { createStaticNetworkDisplayServices } from '../../network-display/createStaticNetworkDisplayServices';
import { allowedTokenIconSizes } from '../TokenIcon/tokenIconTypes';

const NETWORK_1 = asNetworkSymbol('btc');
const NETWORK_2 = asNetworkSymbol('eth');
const NETWORK_3 = asNetworkSymbol('ltc');
const NETWORK_4 = asNetworkSymbol('ada');

const networkDisplay = createStaticNetworkDisplayServices({
    networks: [
        { symbol: NETWORK_1, name: 'Bitcoin' },
        { symbol: NETWORK_2, name: 'Ethereum' },
        { symbol: NETWORK_3, name: 'Litecoin' },
        { symbol: NETWORK_4, name: 'Cardano' },
    ],
});

const meta: Meta<typeof NetworkIconSetComponent> = {
    title: 'NetworkIconSet',
    component: NetworkIconSetComponent,
    decorators: [
        Story => (
            <NetworkDisplayProvider services={networkDisplay}>
                <Story />
            </NetworkDisplayProvider>
        ),
    ],
};
export default meta;

export const NetworkIconSet: StoryObj<NetworkIconSetProps> = {
    args: {
        isToken: true,
        size: 24,
        gap: 16,
        maxVisibleIcons: 3,
        isCountVisible: false,
        isCentered: false,
        isReversed: true,
    },
    argTypes: {
        isToken: {
            control: 'boolean',
        },
        networks: {
            options: ['default', '1', '2', '3', '4'],
            mapping: {
                default: undefined,
                '1': [NETWORK_1],
                '2': [NETWORK_1, NETWORK_2],
                '3': [NETWORK_1, NETWORK_2, NETWORK_3],
                '4': [NETWORK_1, NETWORK_2, NETWORK_3, NETWORK_4],
            },
            control: {
                type: 'select',
                labels: {
                    default: 'Available networks from service',
                    1: '1 network',
                    2: '2 networks',
                    3: '3 networks',
                    4: '4+ networks',
                },
            },
        },
        size: {
            options: allowedTokenIconSizes,
            control: {
                type: 'select',
            },
        },
        gap: {
            options: spacingValues,
            control: {
                type: 'select',
            },
        },
        maxVisibleIcons: {
            options: [null, undefined, 1, 2, 3, 4],
            control: {
                type: 'select',
                labels: {
                    null: 'Unlimited (null)',
                    undefined: 'Default (3)',
                    1: '1',
                    2: '2',
                    3: '3',
                    4: '4',
                },
            },
        },
        isCountVisible: {
            control: 'boolean',
        },
        isCentered: {
            control: 'boolean',
        },
        isReversed: {
            control: 'boolean',
        },
    },
};
