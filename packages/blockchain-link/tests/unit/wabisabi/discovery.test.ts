import { getAddressInfo, getAccountInfo } from '../../../src/workers/wabisabi/discovery';
import { BlockbookAPI } from '../../../src/workers/blockbook/websocket';
import { transformAccountInfo } from '../../../src/workers/blockbook/utils';

const FILTERED_ADDRESSES = [
    'bcrt1pswrqtykue8r89t9u4rprjs0gt4qzkdfuursfnvqaa3f2yql07zmq2fdmpx',
    'bcrt1q7gefpk0ehc738gc4kmltu20uq7rdxnyk7aupqg',
    'n2uwaLQYxRRutG7LQvsATxAb5Ze4GeVfXC',
];

const XPUB =
    'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b';

describe(`WabiSabi discovery`, () => {
    let blockbook: BlockbookAPI;

    beforeAll(async () => {
        blockbook = new BlockbookAPI({
            url: 'http://localhost:19121',
        });
        await blockbook.connect();
    });

    it('getAddressInfo', async () => {
        const referential = await blockbook
            .getAccountInfo({
                descriptor: FILTERED_ADDRESSES[0],
                details: 'txs',
            })
            .then(transformAccountInfo);
        const info = await getAddressInfo({
            descriptor: FILTERED_ADDRESSES[0],
        });
        expect(info).toMatchObject(referential);
    });

    it('getAccountInfo', async () => {
        const referential = await blockbook
            .getAccountInfo({
                descriptor: XPUB,
                details: 'txs',
            })
            .then(transformAccountInfo);
        const info = await getAccountInfo({
            descriptor: XPUB,
        });
        expect(info).toMatchObject(referential);
    });
});
