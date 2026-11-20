let mockIsSdkUnavailable = false;

jest.mock('@blockaid/client', () => {
    if (mockIsSdkUnavailable) {
        throw new Error('Loading chunk failed.');
    }

    return { Blockaid: jest.fn() };
});

describe('getBlockaidClient', () => {
    beforeEach(() => {
        jest.resetModules();
        mockIsSdkUnavailable = false;
    });

    it('shares one client between concurrent and later calls', async () => {
        const { getBlockaidClient } = await import('./client');

        const [firstClient, concurrentClient] = await Promise.all([
            getBlockaidClient(),
            getBlockaidClient(),
        ]);
        const laterClient = await getBlockaidClient();

        expect(concurrentClient).toBe(firstClient);
        expect(laterClient).toBe(firstClient);
    });

    it('loads the SDK again after a failed load', async () => {
        const { getBlockaidClient } = await import('./client');

        mockIsSdkUnavailable = true;
        await expect(getBlockaidClient()).rejects.toThrow('Loading chunk failed.');

        mockIsSdkUnavailable = false;
        await expect(getBlockaidClient()).resolves.toBeDefined();
    });
});
