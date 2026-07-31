import { combineReducers } from '@reduxjs/toolkit';
import * as jws from 'jws';

import { configureMockStore, initPreloadedState } from '@suite-common/test-utils';

import { JWS_SIGN_ALGORITHM } from './releaseNotesConstants';
import { type ReleaseNotesState, releaseNotesReducer } from './releaseNotesSlice';
import { fetchReleaseNotesThunk } from './releaseNotesThunks';
import { type ReleaseNotesManifest, ReleaseNotesPlatform } from './releaseNotesTypes';
import { mockReleaseNotesManifest } from '../mocks/mockReleaseNotesManifest';

// Published manifests are signed by the production key, which is not available here. Verifying
// against the development key instead lets the tests sign fixtures with its publicly known
// counterpart while still exercising the real verification code path.
jest.mock('@trezor/env-utils', () => {
    const actual = jest.requireActual('@trezor/env-utils');

    return {
        ...actual,
        publicKey: { ...actual.publicKey, codesign: actual.publicKey.dev },
    };
});

// Counterpart of `publicKey.dev`, copied from suite-common/message-system/scripts/sign-config.ts.
// There must be no extra spaces at the beginning of the line.
const devPrivateKey = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEINi7lfZE3Y5U9srS58A+AN7Ul7HeBXsHEfzVzijColOkoAcGBSuBBAAKoUQDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END EC PRIVATE KEY-----`;

const signManifest = (manifest: ReleaseNotesManifest) =>
    jws.sign({
        header: { alg: JWS_SIGN_ALGORITHM },
        payload: JSON.stringify(manifest),
        secret: devPrivateKey,
    });

const mockFetchResponse = (body: string) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(body) });
};

const rootReducer = combineReducers({ releaseNotes: releaseNotesReducer });

const initStore = (releaseNotes: Partial<ReleaseNotesState> = {}) =>
    configureMockStore({
        reducer: rootReducer,
        preloadedState: initPreloadedState({ rootReducer, partialState: { releaseNotes } }),
    });

const fetchDesktopReleaseNotes = (store: ReturnType<typeof initStore>) =>
    store.dispatch(fetchReleaseNotesThunk({ platform: ReleaseNotesPlatform.Desktop }));

describe('fetchReleaseNotesThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('stores the releases of a correctly signed manifest', async () => {
        const manifest = mockReleaseNotesManifest();
        mockFetchResponse(signManifest(manifest));

        const store = initStore();
        await fetchDesktopReleaseNotes(store);

        expect(store.getState().releaseNotes).toMatchObject({
            releases: manifest.releases,
            generatedAt: manifest.generatedAt,
            status: 'idle',
        });
    });

    it('rejects a manifest whose signature does not match its payload', async () => {
        const [header, , signature] = signManifest(mockReleaseNotesManifest()).split('.');
        const forgedPayload = Buffer.from(
            JSON.stringify(mockReleaseNotesManifest({ releases: [] })),
        ).toString('base64url');

        mockFetchResponse(`${header}.${forgedPayload}.${signature}`);

        const store = initStore();
        await fetchDesktopReleaseNotes(store);

        expect(store.getState().releaseNotes).toMatchObject({ releases: [], status: 'error' });
    });

    it('rejects a manifest that is not a JWS at all', async () => {
        mockFetchResponse(JSON.stringify(mockReleaseNotesManifest()));

        const store = initStore();
        await fetchDesktopReleaseNotes(store);

        expect(store.getState().releaseNotes.status).toBe('error');
    });

    it('rejects a manifest signed with an unexpected algorithm', async () => {
        mockFetchResponse(
            jws.sign({
                header: { alg: 'HS256' },
                payload: JSON.stringify(mockReleaseNotesManifest()),
                secret: 'not-the-production-key',
            }),
        );

        const store = initStore();
        await fetchDesktopReleaseNotes(store);

        expect(store.getState().releaseNotes.status).toBe('error');
    });

    it('rejects a correctly signed manifest that is older than the stored one', async () => {
        const storedGeneratedAt = '2026-08-05T00:30:00.000Z';
        const replayedManifest = mockReleaseNotesManifest({
            generatedAt: '2026-07-05T00:30:00.000Z',
            releases: [],
        });

        mockFetchResponse(signManifest(replayedManifest));

        const store = initStore({ generatedAt: storedGeneratedAt });
        await fetchDesktopReleaseNotes(store);

        expect(store.getState().releaseNotes).toMatchObject({
            generatedAt: storedGeneratedAt,
            status: 'error',
        });
    });
});
