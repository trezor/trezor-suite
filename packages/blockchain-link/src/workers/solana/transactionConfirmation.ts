import { Connection } from '@solana/web3.js';

const COMMITMENT = 'finalized';

const tryConfirmBySignatureStatus = async (
    api: Connection,
    txBuffer: Buffer,
    signature: string,
    lastValidBlockHeight: number,
    abortSignal: AbortSignal,
) => {
    const getCurrentBlockHeight = async () => {
        try {
            return await api.getBlockHeight('finalized');
        } catch (_) {
            return -1;
        }
    };

    let currentBlockHeight = await getCurrentBlockHeight();
    while (currentBlockHeight <= lastValidBlockHeight) {
        const signatureStatuses = await api.getSignatureStatuses([signature]);
        if (
            signatureStatuses.value.length === 1 &&
            signatureStatuses.value[0] != null &&
            signatureStatuses.value[0].confirmationStatus === COMMITMENT
        ) {
            return signature;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        if (abortSignal.aborted) {
            return signature;
        }
        await api.sendRawTransaction(txBuffer, { skipPreflight: true, maxRetries: 0 });
        currentBlockHeight = await getCurrentBlockHeight();
    }

    throw new Error(
        `TransactionExpiredBlockheightExceededError: Signature ${signature} has expired: block height exceeded.`,
    );
};

const tryConfirmBySignatureSubscription = (api: Connection, signature: string) => {
    let subscriptionId: number | undefined;
    const confirmationPromise = new Promise<string>((resolve, reject) => {
        subscriptionId = api.onSignature(
            signature,
            result => {
                if (result.err != null) {
                    reject(result.err);
                }
                resolve(signature);
            },
            COMMITMENT,
        );
    });

    return { subscriptionId, confirmationPromise };
};

export const confirmTransactionWithResubmit = async (
    api: Connection,
    txBuffer: Buffer,
    signature: string,
    lastValidBlockHeight: number,
) => {
    const { subscriptionId, confirmationPromise: signatureSubscriptionConfirmationPromise } =
        tryConfirmBySignatureSubscription(api, signature);

    const abortController = new AbortController();
    const signatureStatusConfirmationPromise = tryConfirmBySignatureStatus(
        api,
        txBuffer,
        signature,
        lastValidBlockHeight,
        abortController.signal,
    );

    await Promise.race([
        signatureSubscriptionConfirmationPromise,
        signatureStatusConfirmationPromise,
    ]);

    abortController.abort();
    if (subscriptionId != null) {
        api.removeSignatureListener(subscriptionId);
    }

    return signature;
};
