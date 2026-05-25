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
        const idParts = id.split(':');
        const pass = idParts[1] ?? '';
        expect(pass).not.toEqual(oldPass);
        expect(pass.length).toEqual(16);
    });
});
