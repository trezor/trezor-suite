import { asNetworkSymbol } from '@suite-common/wallet-config';

import * as walletSettingsActions from '../walletSettingsActions';
import { changeCoinVisibility } from '../walletSettingsThunks';

const btcSymbol = asNetworkSymbol('btc');
const ltcSymbol = asNetworkSymbol('ltc');
const ethSymbol = asNetworkSymbol('eth');

export const walletSettingsFixtures = [
    {
        description: 'No networks enabled by default if no initial state provided',
        initialState: undefined,
        action: () => changeCoinVisibility({ symbol: ltcSymbol, shouldBeVisible: true }),
        result: {
            enabledNetworks: ['ltc'],
        },
    },
    {
        description: 'Enable already enabled network',
        initialState: { enabledNetworks: [btcSymbol, ltcSymbol] },
        action: () => changeCoinVisibility({ symbol: ltcSymbol, shouldBeVisible: true }),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Disable already enabled network',
        initialState: { enabledNetworks: [btcSymbol, ltcSymbol] },
        action: () => changeCoinVisibility({ symbol: ltcSymbol, shouldBeVisible: false }),
        result: {
            enabledNetworks: ['btc'],
        },
    },
    {
        description: 'Change networks',
        initialState: { enabledNetworks: [] },
        action: () => walletSettingsActions.changeNetworks([ltcSymbol, ethSymbol]),
        result: {
            enabledNetworks: ['eth', 'ltc'],
        },
    },
    {
        description: 'setLocalCurrency',
        initialState: { localCurrency: 'eur' },
        action: () => walletSettingsActions.setBaseCurrency('usd'),
        result: {
            localCurrency: 'usd',
        },
    },
] as const;
