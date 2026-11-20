import { isResponseValidationError } from '@suite-common/http-client';

import { earnYieldWorkerBaseUrl } from '../context';
import { getMerklUsersRewards } from './merkl';

const address = '0x0000000000000000000000000000000000000001';
const body = [{ address, chainId: 1 }];

const mockFetchResponse = (response: unknown) =>
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(response));

describe(getMerklUsersRewards.name, () => {
    beforeEach(() => {
        earnYieldWorkerBaseUrl.set('http://localhost:3001/yield');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the response validated by the generated schema', async () => {
        const rewards = [{ chainId: 1, address, rewards: [], totalClaimable: '0' }];
        mockFetchResponse(rewards);

        await expect(getMerklUsersRewards({ body })).resolves.toEqual(rewards);
    });

    it('rejects a response the generated schema does not accept', async () => {
        mockFetchResponse([{ chainId: 'not a number' }]);

        const error = await getMerklUsersRewards({ body }).catch((e: unknown) => e);

        expect(isResponseValidationError(error)).toBe(true);
    });

    it('rejects without a request when the generated schemas fail to load', async () => {
        await jest.isolateModulesAsync(async () => {
            jest.doMock('@suite-common/earn-stablecoin-defs', () => {
                throw new Error('Loading chunk failed');
            });
            const fetchSpy = mockFetchResponse([]);
            const merkl = await import('./merkl');

            await expect(merkl.getMerklUsersRewards({ body })).rejects.toThrow(
                'Loading chunk failed',
            );
            expect(fetchSpy).not.toHaveBeenCalled();
        });
    });
});
