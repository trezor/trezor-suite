import { Connection } from '@solana/web3.js';

const COMMITMENT = 'finalized';

const tryConfirmBySignatureStatus = async (
    connection: Connection,
    signature: string,
    lastValidBlockHeight: number,
    abortSignal: AbortSignal,
) => {
    const getCurrentBlockHeight = async () => {
        try {
            return await connection.getBlockHeight('finalized');
        } catch (_) {
            return -1;
        }
    };

    let currentBlockHeight = await getCurrentBlockHeight();
    while (currentBlockHeight <= lastValidBlockHeight) {
        const signatureStatus = await connection.getSignatureStatus(signature);
        if (
            signatureStatus.value != null &&
            signatureStatus.value.confirmationStatus === COMMITMENT
        ) {
            return signature;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        if (abortSignal.aborted) {
            return signature;
        }
        currentBlockHeight = await getCurrentBlockHeight();
    }

    throw new Error(
        `TransactionExpiredBlockheightExceededError: Signature ${signature} has expired: block height exceeded.`,
    );
};

const tryConfirmBySignatureSubscription = (connection: Connection, signature: string) => {
    let subscriptionId: number | undefined;
    const confirmationPromise = new Promise<string>((resolve, reject) => {
        subscriptionId = connection.onSignature(
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

export const confirmTransaction = async (
    api: Connection,
    signature: string,
    lastValidBlockHeight: number,
) => {
    const { subscriptionId, confirmationPromise: signatureSubscriptionConfirmationPromise } =
        tryConfirmBySignatureSubscription(api, signature);

    const abortController = new AbortController();
    const signatureStatusConfirmationPromise = tryConfirmBySignatureStatus(
        api,
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
