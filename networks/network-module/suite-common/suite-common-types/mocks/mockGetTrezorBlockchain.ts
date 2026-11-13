import type { GetTrezorBlockchain, TrezorBlockchainApi } from '@trezor/blockchain-core';

export const mockGetTrezorBlockchain: GetTrezorBlockchain<keyof TrezorBlockchainApi> = () => {
    throw new Error('TrezorBlockchain is not mocked for this test.');
};
