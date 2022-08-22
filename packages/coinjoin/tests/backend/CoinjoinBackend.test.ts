import { BlockbookAPI } from '@trezor/blockchain-link/lib/workers/blockbook/websocket';
import { transformAccountInfo } from '@trezor/blockchain-link/src/workers/blockbook/utils';

import { CoinjoinBackend } from '../../src';
import { SLDEV_REGTEST_SETTINGS } from '../../src/constants';
import { SEGWIT_XPUB, SEGWIT_RECEIVE_ADDRESSES } from '../fixtures/methods.fixture';

describe.skip(`CoinjoinBackend`, () => {
    let blockbook: BlockbookAPI;
    let backend: CoinjoinBackend;

    beforeAll(async () => {
        blockbook = new BlockbookAPI({
            url: 'https://coinjoin.corp.sldev.cz/blockbook/',
        });
        await blockbook.connect();
    });

    afterAll(() => {
        blockbook.dispose();
    });

    beforeEach(() => {
        backend = new CoinjoinBackend(SLDEV_REGTEST_SETTINGS);
    });

    it('getAddressInfo', async () => {
        const referential = await blockbook
            .getAccountInfo({
                descriptor: SEGWIT_RECEIVE_ADDRESSES[0],
                details: 'txs',
            })
            .then(transformAccountInfo);
        const info = await backend.getAddressInfo({
            descriptor: SEGWIT_RECEIVE_ADDRESSES[0],
        });
        expect(info).toMatchObject(referential);
    });

    it('getAccountInfo', async () => {
        const referential = await blockbook
            .getAccountInfo({
                descriptor: SEGWIT_XPUB,
                details: 'txs',
            })
            .then(transformAccountInfo);
        const info = await backend.getAccountInfo({
            descriptor: SEGWIT_XPUB,
        });
        expect(info).toMatchObject(referential);
    }, 15000);
});
