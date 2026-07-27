import { createDeferred } from '@trezor/utils';

import { DropboxProvider } from '../DropboxProvider';

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

describe(DropboxProvider.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('runs scheduled API requests one at a time', async () => {
        const provider = new DropboxProvider({ token: 'token', clientId: 'client-id' });
        const firstRequest = createDeferred<typeof emptySearchResult>();
        const secondRequest = createDeferred<typeof emptySearchResult>();
        const filesSearchSpy = jest
            .spyOn(provider.client, 'filesSearchV2')
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
});
