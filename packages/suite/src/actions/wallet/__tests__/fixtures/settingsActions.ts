import * as settingsActions from '@wallet-actions/settingsActions';

export default [
    {
        description: 'Btc should be visible as a default if no initial state provided',
        initialState: {},
        action: () => settingsActions.changeCoinVisibility('ltc', true),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Enable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () => settingsActions.changeCoinVisibility('ltc', true),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Disable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () => settingsActions.changeCoinVisibility('ltc', false),
        result: {
            enabledNetworks: ['btc'],
        },
    },
    {
        description: 'Set hide balance true',
        initialState: { hideBalance: false },
        action: () => settingsActions.setHideBalance(true),
        result: {
            hideBalance: true,
        },
    },
    {
        description: 'Set hide balance false',
        initialState: { hideBalance: true },
        action: () => settingsActions.setHideBalance(false),
        result: {
            hideBalance: false,
        },
    },
    {
        description: 'Change networks',
        initialState: { enabledNetworks: [] },
        action: () => settingsActions.changeNetworks(['ltc', 'eth']),
        result: {
            enabledNetworks: ['ltc', 'eth'],
        },
    },
    {
        description: 'toggleGroupCoinsVisibility - show all ethereum like',
        initialState: { enabledNetworks: [] },
        action: () => settingsActions.toggleGroupCoinsVisibility(n => n.networkType === 'ethereum'),
        result: {
            enabledNetworks: ['eth', 'etc', 'trop'],
        },
    },
    {
        description: 'toggleGroupCoinsVisibility - hide all ethereum like',
        initialState: { enabledNetworks: ['btc', 'eth'] },
        action: () => settingsActions.toggleGroupCoinsVisibility(n => n.networkType === 'ethereum'),
        result: {
            enabledNetworks: ['btc'],
        },
    },
    {
        description: 'toggleGroupCoinsVisibility - hide all (no filter provided)',
        initialState: { enabledNetworks: ['btc', 'eth'] },
        action: () => settingsActions.toggleGroupCoinsVisibility(undefined),
        result: {
            enabledNetworks: [],
        },
    },
    {
        description: 'setLocalCurrency',
        initialState: { localCurrency: 'eur' },
        action: () => settingsActions.setLocalCurrency('usd'),
        result: {
            localCurrency: 'usd',
        },
    },
] as const;
