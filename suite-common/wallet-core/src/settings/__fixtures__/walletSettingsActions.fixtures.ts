import * as walletSettingsActions from '../walletSettingsActions';
import { changeCoinVisibility } from '../walletSettingsThunks';

export const walletSettingsFixtures = [
    {
        description: 'No networks enabled by default if no initial state provided',
        initialState: undefined,
        action: () => changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: true }),
        result: {
            enabledNetworks: ['ltc'],
        },
    },
    {
        description: 'Enable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () => changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: true }),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Disable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () => changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: false }),
        result: {
            enabledNetworks: ['btc'],
        },
    },
    {
        description: 'Change networks',
        initialState: { enabledNetworks: [] },
        action: () => walletSettingsActions.changeNetworks(['ltc', 'eth']),
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
