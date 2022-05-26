import { CoinjoinClient } from '../src';

describe(`CoinjoinClient`, () => {
    it('enable success', async () => {
        const cli = new CoinjoinClient({
            network: 'regtest',
            coordinatorName: 'Name',
            coordinatorUrl: 'url',
            middlewareUrl: 'url',
        });
        const initialStatus = await cli.enable();
        expect(initialStatus.rounds.length).toBeGreaterThan(0);
    });
});
