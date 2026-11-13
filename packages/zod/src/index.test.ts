import { config } from './index';

describe('@trezor/zod', () => {
    it('turns off the zod JIT', () => {
        expect(config().jitless).toBe(true);
    });
});
