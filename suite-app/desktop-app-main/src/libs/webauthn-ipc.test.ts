import { EncryptionUnavailable } from '@suite-common/platform-encryption';
import { createMockDeps } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import { type EvaluatePrfFromIpcDeps, createEvaluatePrfFromIpc } from './webauthn-ipc';

const createDeps = () =>
    createMockDeps<EvaluatePrfFromIpcDeps>({
        webauthnAuthenticator: {
            createCredential: null,
            evaluatePrf: () => Promise.resolve(ok('0102')),
        },
    });

describe(createEvaluatePrfFromIpc.name, () => {
    it('passes valid parameters to the authenticator', async () => {
        const deps = createDeps();

        const result = await createEvaluatePrfFromIpc(deps)({
            credentialIdHex: 'abcd',
            saltHex: 'ff00',
            extra: 'ignored',
        });

        expect(result).toEqual(ok('0102'));
        expect(deps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledWith({
            credentialIdHex: 'abcd',
            saltHex: 'ff00',
        });
    });

    it.each([
        undefined,
        null,
        'abcd',
        { credentialIdHex: 'abcd' },
        { credentialIdHex: 'abcd', saltHex: 'xyz' },
        { credentialIdHex: 'abc', saltHex: 'ff00' },
        { credentialIdHex: 1, saltHex: 'ff00' },
    ])('rejects %p without asking the authenticator', async params => {
        const deps = createDeps();

        const result = await createEvaluatePrfFromIpc(deps)(params);

        expect(result).toEqual(err(EncryptionUnavailable('Invalid WebAuthn PRF parameters')));
        expect(deps.webauthnAuthenticator.evaluatePrf).not.toHaveBeenCalled();
    });
});
