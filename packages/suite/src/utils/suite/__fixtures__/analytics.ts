const version = '1.0';

export default [
    {
        currentDate: '2021-04-01T12:10:00.000Z',
        input: {
            type: 'transport-type',
            payload: {
                type: 'bridge',
                version: '2',
            },
        },
        encoded: `c_v=${version}&c_type=transport-type&c_commit=&c_instance_id=1&c_session_id=2&c_timestamp=${new Date(
            '2021-04-01T12:10:00.000Z',
        ).getTime()}&type=bridge&version=2`,
    },
    {
        currentDate: '2021-04-01T12:10:00.000Z',
        input: {
            type: 'initial-run-completed',
            payload: {
                analytics: false,
            },
        },
        encoded: `c_v=${version}&c_type=initial-run-completed&c_commit=&c_instance_id=1&c_session_id=2&c_timestamp=${new Date(
            '2021-04-01T12:10:00.000Z',
        ).getTime()}&analytics=false`,
    },
] as const;
