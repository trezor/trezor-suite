import { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';
import { blockbookUtils } from '@trezor/blockchain-link-utils';

import { CoinjoinBackend } from '../../src';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';
import { SEGWIT_XPUB, SEGWIT_RECEIVE_ADDRESSES } from '../fixtures/methods.fixture';

describe.skip(`CoinjoinBackend`, () => {
    let blockbook: BlockbookAPI;
    let backend: CoinjoinBackend;

    beforeAll(async () => {
        blockbook = new BlockbookAPI({
            url: 'http://localhost:8081/blockbook/',
        });
        await blockbook.connect();
    });

    afterAll(() => {
        blockbook.dispose();
    });

    beforeEach(() => {
        backend = new CoinjoinBackend(COINJOIN_BACKEND_SETTINGS);
    });

    it('scanAddress', async () => {
        const referential = await blockbook
            .getAccountInfo({
                descriptor: SEGWIT_RECEIVE_ADDRESSES[0],
                details: 'txs',
            })
            .then(blockbookUtils.transformAccountInfo);
        const info = await backend.scanAddress({
            descriptor: SEGWIT_RECEIVE_ADDRESSES[0],
        });
        expect(info).toMatchObject(referential);
    });

    it('scanAccount', async () => {
        const referential = await blockbook
            .getAccountInfo({
                descriptor: SEGWIT_XPUB,
                details: 'txs',
            })
            .then(blockbookUtils.transformAccountInfo);
        const info = await backend.scanAccount({
            descriptor: SEGWIT_XPUB,
        });
        expect(info).toMatchObject(referential);
    }, 15000);
});
