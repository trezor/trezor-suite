import SuiteOnlyMethod from './suiteOnlyMethod';

const payloads: ConstructorParameters<typeof SuiteOnlyMethod>[0]['payload'][] = [
    { method: 'getAccountInfo', coin: 'btc', descriptor: 'xpub' },
    { method: 'pushTransaction', coin: 'btc', tx: '00' },
    { method: 'sendTransaction', coin: 'btc', outputs: [] },
];

describe('SuiteOnlyMethod', () => {
    it.each(payloads)('leaves $method to Trezor Suite', async payload => {
        await expect(new SuiteOnlyMethod({ payload }).run()).rejects.toMatchObject({
            code: 'Method_NotAllowed',
            message: `${payload.method} is available only through Trezor Suite`,
        });
    });
});
