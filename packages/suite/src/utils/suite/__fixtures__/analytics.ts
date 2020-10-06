const version = '1.0';

export default [
    {
        input: {
            type: 'transport-type',
            payload: {
                type: 'bridge',
                version: '2',
            },
        },
        encoded: `c_v=${version}&c_type=transport-type&c_instance_id=1&c_session_id=2&type=bridge&version=2`,
    },
    {
        input: {
            type: 'initial-run-completed',
            payload: {
                analytics: false,
            },
        },
        encoded: `c_v=${version}&c_type=initial-run-completed&c_instance_id=1&c_session_id=2&analytics=false`,
    },
    {
        input: {
            type: 'suite-ready',
            payload: {
                language: 'en',
                enabledNetworks: ['btc', 'eth'] as any,
                localCurrency: 'czk',
                discreetMode: true,
                screenHeight: 1000,
                screenWidth: 1000,
                platform: 'Linux',
                platformLanguage: 'zulu',
            },
        },
        encoded: `c_v=${version}&c_type=suite-ready&c_instance_id=1&c_session_id=2&language=en&enabledNetworks=btc%2Ceth&localCurrency=czk&discreetMode=true&screenHeight=1000&screenWidth=1000&platform=Linux&platformLanguage=zulu`,
    },
] as const;
