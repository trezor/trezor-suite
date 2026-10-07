import type { EthereumSweepPlan } from '../ethereum/composeEthereumSweep';
import type { SignedEthereumSweep } from '../ethereum/verifySignedEthereumSweep';

export type SignedEthereumSweepRecord = SignedEthereumSweep & {
    plan: EthereumSweepPlan;
};

/**
 * Memory of what this page session already sent to the device and signed, for the Ethereum
 * chains. A plan that reached the device is never sent again, and an address whose nonce on one
 * chain already has a signed transaction gets no second one: the stored bytes are broadcast
 * instead.
 * It is deliberately not persisted: after a reload the state is rebuilt from the backend.
 */
export type EthereumSweepLedger = {
    /** Tells whether the plan was already sent to the device once. */
    hasAttempted: (plan: EthereumSweepPlan) => boolean;
    markAttempted: (plan: EthereumSweepPlan) => void;
    recordSigned: (record: SignedEthereumSweepRecord) => void;
    getSignedSweeps: () => readonly SignedEthereumSweepRecord[];
    /**
     * The signed transaction of an address with the given nonce on the given chain, if there is
     * one. The chain belongs in the key: Ethereum Classic is swept from the Ethereum path family
     * too, so one address can carry an independent nonce on either chain.
     */
    findSigned: (
        chainId: number,
        address: string,
        nonce: number,
    ) => SignedEthereumSweepRecord | undefined;
};

const getNonceKey = (chainId: number, address: string, nonce: number) =>
    `${chainId}|${address.toLowerCase()}|${nonce}`;

/** Identity of a transaction skeleton: signer, nonce, destination, amount and gas price. */
export const getEthereumSkeletonId = ({
    chainId,
    account,
    nonce,
    destination,
    amount,
    gasPrice,
}: EthereumSweepPlan) =>
    [
        chainId,
        account.address.toLowerCase(),
        nonce,
        destination.address.toLowerCase(),
        amount,
        gasPrice,
    ].join('|');

export const createEthereumSweepLedger = (): EthereumSweepLedger => {
    const attemptedSkeletons = new Set<string>();
    const signedSweeps: SignedEthereumSweepRecord[] = [];
    const signedByNonce = new Map<string, SignedEthereumSweepRecord>();

    return {
        hasAttempted: plan => attemptedSkeletons.has(getEthereumSkeletonId(plan)),
        markAttempted: plan => {
            attemptedSkeletons.add(getEthereumSkeletonId(plan));
        },
        recordSigned: record => {
            signedSweeps.push(record);
            signedByNonce.set(
                getNonceKey(record.plan.chainId, record.plan.account.address, record.plan.nonce),
                record,
            );
        },
        getSignedSweeps: () => signedSweeps,
        findSigned: (chainId, address, nonce) =>
            signedByNonce.get(getNonceKey(chainId, address, nonce)),
    };
};
