import { createInMemoryDbMock } from '../../mocks/createInMemoryDbMock';

describe('storage', () => {
    test('2 calls to uninitiated db', async () => {
        const db = createInMemoryDbMock({ dispatch: jest.fn(), reloadApp: jest.fn() });

        db.addItem('coinjoinDebugSettings', {}, 'debug', true);
        await db.addItem('coinjoinDebugSettings', {}, 'debug', true);

        await db.removeDatabase();

        // should not log anything after jest exits. there are no assertions here but for some reason
        // in jest 29 and node 18 on linux it seems to be exiting with code 1 should it try to log something
        // after this test is finished
    });
});
