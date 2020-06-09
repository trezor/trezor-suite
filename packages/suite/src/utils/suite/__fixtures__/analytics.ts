export default [
    {
        input: {
            eventType: 'transport-type',
            payload: {
                type: 'bridge',
                version: '2',
            },
        },
        encoded: {
            common: 'instanceId=1&sessionId=2',
            specific: 'eventType=transport-type&type=bridge&version=2',
        },
    },
    {
        input: {
            eventType: 'initial-run-completed',
            payload: {
                analytics: false,
            },
        },
        encoded: {
            common: 'instanceId=1&sessionId=2',
            specific: 'eventType=initial-run-completed&analytics=false',
        },
    },
    {
        input: {
            eventType: 'suite-ready',
            payload: {
                language: 'en',
                enabledNetworks: ['btc', 'eth'] as any,
                localCurrency: 'czk',
                discreetMode: true,
            },
        },
        encoded: {
            common: 'instanceId=1&sessionId=2',
            specific:
                'eventType=suite-ready&language=en&enabledNetworks=btc%2Ceth&localCurrency=czk&discreetMode=true',
        },
    },
] as const;
