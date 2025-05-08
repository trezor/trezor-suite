import * as walletSettingsActions from '../../src/settings/walletSettingsActions';

export const walletSettingsFixtures = [
    {
        description: 'Btc should be visible as a default if no initial state provided',
        initialState: undefined,
        action: () =>
            walletSettingsActions.changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: true }),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Enable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () =>
            walletSettingsActions.changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: true }),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Disable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () =>
            walletSettingsActions.changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: false }),
        result: {
            enabledNetworks: ['btc'],
        },
    },
    {
        description: 'Set hide balance true',
        initialState: { discreetMode: false },
        action: () => walletSettingsActions.setDiscreetMode(true),
        result: {
            discreetMode: true,
        },
    },
    {
        description: 'Set hide balance false',
        initialState: { discreetMode: true },
        action: () => walletSettingsActions.setDiscreetMode(false),
        result: {
            discreetMode: false,
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
        action: () => walletSettingsActions.setLocalCurrency('usd'),
        result: {
            localCurrency: 'usd',
        },
    },
] as const;
