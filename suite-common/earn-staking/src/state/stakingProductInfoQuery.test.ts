/**
 * @jest-environment jsdom
 */
// The query client only garbage-collects on a client, the node environment counts as a server.
import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { createQueryClient, onlineManager } from '@suite-common/react-query';
import { mock } from '@trezor/dependency-injection';

import {
    getCachedStakingProductInfo,
    getStakingProductInfoQueryOptions,
} from './stakingProductInfoQuery';
import { mockStakingProductRepository } from '../../mocks';

const descriptor = mockStakingProductDescriptor();

const createQueryOptions = (fetchProductInfo: StakingProductAdapter['fetchProductInfo']) =>
    getStakingProductInfoQueryOptions({
        stakingProductRepository: mockStakingProductRepository({
            get: mock(() => mockStakingProductAdapter({ descriptor, fetchProductInfo })),
        }),
        productId: descriptor.id,
    });

describe('getStakingProductInfoQueryOptions', () => {
    afterEach(() => {
        jest.useRealTimers();
        onlineManager.setOnline(true);
    });

    it('keeps the info without a subscriber past the default garbage collection time', async () => {
        jest.useFakeTimers();
        const queryClient = createQueryClient({ shouldRefetchOnEvents: false });

        await queryClient.fetchQuery(
            createQueryOptions(mock(() => Promise.resolve(mockStakingProductInfo()))),
        );
        jest.advanceTimersByTime(60 * 60 * 1000);

        expect(getCachedStakingProductInfo(queryClient, descriptor.id)).toEqual(
            mockStakingProductInfo(),
        );
    });

    it('fails a fetch while offline instead of pausing it', async () => {
        const queryClient = createQueryClient({ shouldRefetchOnEvents: false });

        onlineManager.setOnline(false);

        await expect(
            queryClient.fetchQuery(
                createQueryOptions(mock(() => Promise.reject(new Error('offline')))),
            ),
        ).rejects.toThrow('offline');
    });
});
