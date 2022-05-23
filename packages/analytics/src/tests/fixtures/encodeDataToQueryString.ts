export default [
    {
        currentDate: '2021-04-01T12:10:00.000Z',
        instanceId: '1',
        sessionId: '2',
        commitId: 'abcdef',
        version: '1.18',
        data: {
            type: 'transport-type',
            payload: {
                type: 'bridge',
                version: '2',
            },
        },
        encoded: `c_v=1.18&c_type=transport-type&c_commit=abcdef&c_instance_id=1&c_session_id=2&c_timestamp=${new Date(
            '2021-04-01T12:10:00.000Z',
        ).getTime()}&type=bridge&version=2`,
    },
    {
        currentDate: '2021-04-02T12:10:00.000Z',
        instanceId: '3',
        sessionId: '5',
        commitId: '123456',
        version: '1.0',
        data: {
            type: 'menu/guide',
        },
        encoded: `c_v=1.0&c_type=menu%2Fguide&c_commit=123456&c_instance_id=3&c_session_id=5&c_timestamp=${new Date(
            '2021-04-02T12:10:00.000Z',
        ).getTime()}`,
    },
] as const;
