import { EARN_PROVIDERS, STAKING_PROVIDERS } from './stakingProviders';

describe('STAKING_PROVIDERS', () => {
    it('keys every provider by its own id', () => {
        Object.entries(STAKING_PROVIDERS).forEach(([key, provider]) => {
            expect(provider.id).toBe(key);
        });
        Object.entries(EARN_PROVIDERS).forEach(([key, provider]) => {
            expect(provider.id).toBe(key);
        });
    });
});
