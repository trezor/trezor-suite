import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';

export default [
    {
        description: 'Btc should be visible as a default if no initial state provided',
        initialState: undefined,
        action: () => walletSettingsActions.changeCoinVisibility('ltc', true),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Enable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () => walletSettingsActions.changeCoinVisibility('ltc', true),
        result: {
            enabledNetworks: ['btc', 'ltc'],
        },
    },
    {
        description: 'Disable already enabled network',
        initialState: { enabledNetworks: ['btc', 'ltc'] },
        action: () => walletSettingsActions.changeCoinVisibility('ltc', false),
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
