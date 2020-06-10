const version = '1.0';

export default [
    {
        input: {
            eventType: 'transport-type',
            payload: {
                type: 'bridge',
                version: '2',
            },
        },
        encoded: `v=${version}&eventType=transport-type&instanceId=1&sessionId=2&type=bridge&version=2`,
    },
    {
        input: {
            eventType: 'initial-run-completed',
            payload: {
                analytics: false,
            },
        },
        encoded: `v=${version}&eventType=initial-run-completed&instanceId=1&sessionId=2&analytics=false`,
    },
    {
        input: {
            eventType: 'suite-ready',
            payload: {
                language: 'en',
                enabledNetworks: ['btc', 'eth'] as any,
                localCurrency: 'czk',
                discreetMode: true,
                screenHeight: 1000,
                screenWidth: 1000,
            },
        },
        encoded: `v=${version}&eventType=suite-ready&instanceId=1&sessionId=2&language=en&enabledNetworks=btc%2Ceth&localCurrency=czk&discreetMode=true&screenHeight=1000&screenWidth=1000`,
    },
] as const;
