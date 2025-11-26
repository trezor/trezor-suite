import { WalletDescriptor } from '@suite-common/wallet-types';

type SubscriptionKey = 'labeling'; // for example: "labeling", ...

export const subscriptionStorage: Record<
    WalletDescriptor,
    Partial<Record<SubscriptionKey, () => void>>
> = {};
