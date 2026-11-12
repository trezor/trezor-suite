import { createMockDeps } from '@trezor/dependency-injection';
import { ok } from '@trezor/type-utils';

import {
    type DesktopApiWebauthnAuthenticatorDeps,
    createDesktopApiWebauthnAuthenticator,
} from './desktopApiWebauthnAuthenticator';

describe(createDesktopApiWebauthnAuthenticator.name, () => {
    it('forwards both operations to the desktop API', async () => {
        const deps = createMockDeps<DesktopApiWebauthnAuthenticatorDeps>({
            desktopApi: {
                webauthnCreateCredential: () =>
                    Promise.resolve(ok({ credentialIdHex: 'abcd', isPrfEnabled: undefined })),
                webauthnEvaluatePrf: () => Promise.resolve(ok('0102')),
            },
        });
        const authenticator = createDesktopApiWebauthnAuthenticator(deps);
        const params = { credentialIdHex: 'abcd', saltHex: 'ff00' };

        expect(await authenticator.createCredential()).toEqual(
            ok({ credentialIdHex: 'abcd', isPrfEnabled: undefined }),
        );
        expect(await authenticator.evaluatePrf(params)).toEqual(ok('0102'));
        expect(deps.desktopApi.webauthnEvaluatePrf).toHaveBeenCalledWith(params);
    });
});
