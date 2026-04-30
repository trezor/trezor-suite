type SparkWalletSubscription = {
    unsubscribe: () => void;
    walletKey: string;
};

export type SparkWalletSubscriptionStorage = {
    add: (params: SparkWalletSubscription) => void;
    dispose: (walletKey: string) => void;
    has: (walletKey: string) => boolean;
};

export type SparkWalletSubscriptionStorageDep = {
    sparkWalletSubscriptionStorage: SparkWalletSubscriptionStorage;
};

export const createSparkWalletSubscriptionStorage = (): SparkWalletSubscriptionStorage => {
    const subscriptions: Record<string, () => void> = {};

    return {
        add: ({ unsubscribe, walletKey }) => {
            const existingUnsubscribe = subscriptions[walletKey];

            if (existingUnsubscribe !== undefined) {
                existingUnsubscribe();
            }

            subscriptions[walletKey] = unsubscribe;
        },
        dispose: walletKey => {
            subscriptions[walletKey]?.();
            delete subscriptions[walletKey];
        },
        has: walletKey => walletKey in subscriptions,
    };
};
