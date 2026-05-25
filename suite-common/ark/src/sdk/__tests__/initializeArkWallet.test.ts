jest.mock('@arkade-os/sdk', () => ({
    Wallet: {
        create: jest.fn(),
    },
}));

import { Wallet } from '@arkade-os/sdk';

import { ARK_SIGNET_ESPLORA_URL, ARK_SIGNET_SERVER_URL } from '../arkConstants';
import { initializeArkWallet } from '../initializeArkWallet';

describe('initializeArkWallet', () => {
    const mockCreate = jest.mocked(Wallet.create);

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreate.mockResolvedValue({} as never);
    });

    it('initializes Wallet against signet defaults when no overrides are passed', async () => {
        const identity = {};

        await initializeArkWallet({ identity: identity as never });

        expect(mockCreate).toHaveBeenCalledWith({
            identity,
            arkServerUrl: ARK_SIGNET_SERVER_URL,
            esploraUrl: ARK_SIGNET_ESPLORA_URL,
        });
    });

    it('forwards caller-provided operator and esplora overrides', async () => {
        const identity = {};
        const arkServerUrl = 'https://mutinynet.arkade.sh';
        const esploraUrl = 'https://mempool.mutinynet.arkade.sh/api';

        await initializeArkWallet({
            identity: identity as never,
            arkServerUrl,
            esploraUrl,
        });

        expect(mockCreate).toHaveBeenCalledWith({
            identity,
            arkServerUrl,
            esploraUrl,
        });
    });
});
