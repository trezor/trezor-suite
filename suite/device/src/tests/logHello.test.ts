import { logHello } from '../logHello';

describe('hello logger', () => {
    it('logger returns true', () => {
        expect(logHello()).toBeTruthy();
    });
});
