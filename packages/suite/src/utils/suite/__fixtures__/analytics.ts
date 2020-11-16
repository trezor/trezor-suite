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
] as const;
