import { type Meta, type StoryObj } from '@storybook/react';

import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { spacingValues } from '@trezor/theme';

import {
    NetworkIconSet as NetworkIconSetComponent,
    type NetworkIconSetProps,
} from './NetworkIconSet';
import { TokenIcon } from '../TokenIcon/TokenIcon';
import { allowedTokenIconSizes } from '../TokenIcon/tokenIconTypes';

type NetworkIconSetStoryProps = Omit<NetworkIconSetProps, 'networks'> & {
    networks: { symbol: NetworkSymbol; name: string }[];
};

const NETWORK_1 = { symbol: asNetworkSymbol('btc'), name: 'Bitcoin' };
const NETWORK_2 = { symbol: asNetworkSymbol('eth'), name: 'Ethereum' };
const NETWORK_3 = { symbol: asNetworkSymbol('ltc'), name: 'Litecoin' };
const NETWORK_4 = { symbol: asNetworkSymbol('ada'), name: 'Cardano' };

const meta: Meta<typeof NetworkIconSetComponent> = {
    title: 'NetworkIconSet',
    component: NetworkIconSetComponent,
};
export default meta;

export const NetworkIconSet: StoryObj<NetworkIconSetStoryProps> = {
    render: ({ networks, ...props }) => (
        <NetworkIconSetComponent
            {...props}
            networks={networks.map(network => ({
                ...network,
                icon: <TokenIcon symbol={network.symbol} size={props.size} />,
            }))}
        />
    ),
    args: {
        networks: [NETWORK_1, NETWORK_2, NETWORK_3, NETWORK_4],
        size: 24,
        gap: 16,
        maxVisibleIcons: 3,
        isCountVisible: false,
        isCentered: false,
        isReversed: true,
    },
    argTypes: {
        networks: {
            options: ['1', '2', '3', '4'],
            mapping: {
                '1': [NETWORK_1],
                '2': [NETWORK_1, NETWORK_2],
                '3': [NETWORK_1, NETWORK_2, NETWORK_3],
                '4': [NETWORK_1, NETWORK_2, NETWORK_3, NETWORK_4],
            },
            control: {
                type: 'select',
                labels: {
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
