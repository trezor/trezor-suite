import {
    settingsActions as walletSettingsActions,
    changeCoinVisibility,
    setDiscreetMode,
} from '@suite-common/wallet-core';

export default [
    {
        description: 'Btc should be visible as a default if no initial state provided',
        initialState: undefined,
        action: () => changeCoinVisibility({ symbol: 'ltc', shouldBeVisible: true }),
        result: {
            enabledNetworks: ['btc', 'ltc'],
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
        description: 'Set hide balance true',
        initialState: { discreetMode: false },
        action: () => setDiscreetMode(true),
        result: {
            discreetMode: true,
        },
    },
    {
        description: 'Set hide balance false',
        initialState: { discreetMode: true },
        action: () => setDiscreetMode(false),
        result: {
            discreetMode: false,
        },
    },
    {
        description: 'Change networks',
        initialState: { enabledNetworks: [] },
        action: () => walletSettingsActions.changeNetworks(['ltc', 'eth']),
        result: {
            enabledNetworks: ['ltc', 'eth'],
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
