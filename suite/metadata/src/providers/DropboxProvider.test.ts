import { mockGetHttpReceiverAddress } from '@suite/desktop-app-api/mocks';
import { mock } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { DropboxProvider } from './DropboxProvider';
import { type OauthDesktopApiDep } from '../oauth';

const globalContext = globalThis as typeof globalThis & { window?: typeof globalThis };
if (!globalContext.window) {
    globalContext.window = globalThis as any;
}

const emptySearchResult = {
    status: 200,
    headers: {},
    result: {
        has_more: false,
        matches: [],
    },
};

const sdkLoadError = {
    success: false,
    code: 'CONNECTIVITY_ERROR',
    error: 'Failed to load Dropbox SDK',
};

const mockDropboxSDKLoadFailure = () => {
    jest.doMock('dropbox', () => {
        throw new Error('Loading chunk failed');
    });
};

const { desktopApi }: OauthDesktopApiDep = {
    desktopApi: {
        available: false,
        getHttpReceiverAddress: mockGetHttpReceiverAddress(),
        once: mock(),
        removeAllListeners: mock(),
    },
};

describe(DropboxProvider.name, () => {
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        jest.dontMock('dropbox');
        // A mocked module stays cached in the registry, so the next test's factory would never run.
        jest.resetModules();
    });

    it('runs scheduled API requests one at a time', async () => {
        const provider = new DropboxProvider({ desktopApi, token: 'token', clientId: 'client-id' });
        const { client } = await provider.getSDK();
        const firstRequest = createDeferred<typeof emptySearchResult>();
        const secondRequest = createDeferred<typeof emptySearchResult>();
        const filesSearchSpy = jest
            .spyOn(client, 'filesSearchV2')
            .mockReturnValueOnce(firstRequest.promise)
            .mockReturnValueOnce(secondRequest.promise);

        const firstResult = provider.getFileContent('first.mtdt');
        const secondResult = provider.getFileContent('second.mtdt');

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(filesSearchSpy).toHaveBeenCalledTimes(1);

        firstRequest.resolve(emptySearchResult);
        await firstResult;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(filesSearchSpy).toHaveBeenCalledTimes(2);

        secondRequest.resolve(emptySearchResult);
        await secondResult;
    });

    it('pauses the request queue according to Dropbox Retry-After', async () => {
        jest.useFakeTimers();

        const provider = new DropboxProvider({ desktopApi, token: 'token', clientId: 'client-id' });
        const { client } = await provider.getSDK();
        const filesSearchSpy = jest
            .spyOn(client, 'filesSearchV2')
            .mockRejectedValueOnce({
                status: 429,
                headers: {
                    get: (name: string) => (name.toLowerCase() === 'retry-after' ? '2' : null),
                },
                error: { error_summary: 'too_many_requests' },
            })
            .mockResolvedValueOnce(emptySearchResult);

        const result = provider.getFileContent('file.mtdt');

        await jest.advanceTimersByTimeAsync(0);
        expect(filesSearchSpy).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1999);
        expect(filesSearchSpy).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1);
        await result;

        expect(filesSearchSpy).toHaveBeenCalledTimes(2);
    });

    it('applies Retry-After to requests already waiting in the queue', async () => {
        jest.useFakeTimers();

        const provider = new DropboxProvider({ desktopApi, token: 'token', clientId: 'client-id' });
        const firstRequest = jest
            .fn()
            .mockResolvedValue(provider.error('RATE_LIMIT_ERROR', 'too many requests', 2000));
        const secondRequest = jest.fn().mockResolvedValue(provider.ok());

        const firstResult = provider.scheduleApiRequest(firstRequest, {
            retries: 0,
            delay: 1000,
        });
        const secondResult = provider.scheduleApiRequest(secondRequest, {
            retries: 0,
            delay: 1000,
        });

        await jest.advanceTimersByTimeAsync(0);
        await firstResult;

        expect(firstRequest).toHaveBeenCalledTimes(1);
        expect(secondRequest).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1999);
        expect(secondRequest).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        await secondResult;

        expect(secondRequest).toHaveBeenCalledTimes(1);
    });

    it('keeps the fixed retry delay when Retry-After is unavailable', async () => {
        jest.useFakeTimers();

        const provider = new DropboxProvider({ desktopApi, token: 'token', clientId: 'client-id' });
        const { client } = await provider.getSDK();
        const filesSearchSpy = jest
            .spyOn(client, 'filesSearchV2')
            .mockRejectedValueOnce({
                status: 429,
                headers: {
                    get: () => null,
                },
                error: { error_summary: 'too_many_requests' },
            })
            .mockResolvedValueOnce(emptySearchResult);

        const result = provider.getFileContent('file.mtdt');

        await jest.advanceTimersByTimeAsync(999);
        expect(filesSearchSpy).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1);
        await result;

        expect(filesSearchSpy).toHaveBeenCalledTimes(2);
    });

    it('reports a failed Dropbox SDK load and loads it again on the next call', async () => {
        let hasFailedToLoad = false;
        jest.doMock('dropbox', () => {
            if (!hasFailedToLoad) {
                hasFailedToLoad = true;
                throw new Error('Loading chunk failed');
            }

            return jest.requireActual('dropbox');
        });

        const provider = new DropboxProvider({ desktopApi, token: 'token', clientId: 'client-id' });

        await expect(provider.getFileContent('file.mtdt')).resolves.toEqual(sdkLoadError);

        const { client } = await provider.getSDK();
        const filesSearchSpy = jest
            .spyOn(client, 'filesSearchV2')
            .mockResolvedValueOnce(emptySearchResult);

        await expect(provider.getFileContent('file.mtdt')).resolves.toEqual({ success: true });
        expect(filesSearchSpy).toHaveBeenCalledTimes(1);
    });

    it.each<[string, (provider: DropboxProvider) => Promise<unknown>]>([
        ['connect', provider => provider.connect()],
        ['disconnect', provider => provider.disconnect()],
        ['getProviderDetails', provider => provider.getProviderDetails()],
        ['getFileContent', provider => provider.getFileContent('file.mtdt')],
        ['setFileContent', provider => provider.setFileContent('file.mtdt', Buffer.from('labels'))],
        ['getFilesList', provider => provider.getFilesList()],
        ['renameFile', provider => provider.renameFile('old.mtdt', 'new.mtdt')],
    ])(
        '%s resolves with a connectivity error when the Dropbox SDK fails to load',
        async (_, call) => {
            mockDropboxSDKLoadFailure();

            const provider = new DropboxProvider({
                desktopApi,
                token: 'token',
                clientId: 'client-id',
            });

            await expect(call(provider)).resolves.toEqual(sdkLoadError);
        },
    );

    it('is not connected when the Dropbox SDK fails to load', async () => {
        mockDropboxSDKLoadFailure();

        const provider = new DropboxProvider({ desktopApi, token: 'token', clientId: 'client-id' });

        await expect(provider.isConnected()).resolves.toBe(false);
    });
});
