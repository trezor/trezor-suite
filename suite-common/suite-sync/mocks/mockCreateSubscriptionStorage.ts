import { type SubscriptionStorage } from '@suite-common/suite-sync-types';

type SubscriptionStorageMock = jest.Mocked<SubscriptionStorage>;

export const createSubscriptionStorageMock = (): SubscriptionStorageMock => ({
    add: jest.fn(),
    dispose: jest.fn(),
    has: jest.fn(),
});
