import { resetIdentityCircuit } from '../../src/utils/http';

describe('resetIdentityCircuit', () => {
    it('identity without password', () => {
        const id = resetIdentityCircuit('username');
        expect(id).toMatch(/username:[a-zA-Z0-9]+/);
    });
    it('identity with new password', () => {
        const oldPass = 'abcd';
        const id = resetIdentityCircuit(`username:${oldPass}`);
        expect(id).toMatch(/username:[a-zA-Z0-9]+/);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [, pass]: [string, string] = id.split(':');
        expect(pass).not.toEqual(oldPass);
        expect(pass.length).toEqual(16);
    });
});
