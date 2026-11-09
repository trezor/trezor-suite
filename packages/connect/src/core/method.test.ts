import { getMethod } from './method';

describe(getMethod.name, () => {
    it.each(['evoluGetNode', 'evoluGetDelegatedIdentityKey', 'evoluSignRegistrationRequest'])(
        'does not provide the internal method %s',
        async method => {
            await expect(
                getMethod({ id: 1, type: 'iframe-call', payload: { method } } as never),
            ).rejects.toMatchObject({ code: 'Method_InvalidParameter' });
        },
    );
});
