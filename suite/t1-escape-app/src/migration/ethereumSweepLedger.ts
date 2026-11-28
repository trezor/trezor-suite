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
    /**
     * How many plans of the address on the chain were already sent to the device. Nothing in an
     * Ethereum plan varies between two attempts on its own, so composition uses the count to
     * keep a recomposed plan apart from the one the device has already seen.
     */
    countAttempts: (chainId: number, address: string) => number;
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

const getAddressKey = (chainId: number, address: string) => `${chainId}|${address.toLowerCase()}`;

const getNonceKey = (chainId: number, address: string, nonce: number) =>
    `${getAddressKey(chainId, address)}|${nonce}`;

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
    const attemptCounts = new Map<string, number>();
    const signedSweeps: SignedEthereumSweepRecord[] = [];
    const signedByNonce = new Map<string, SignedEthereumSweepRecord>();

    return {
        hasAttempted: plan => attemptedSkeletons.has(getEthereumSkeletonId(plan)),
        countAttempts: (chainId, address) =>
            attemptCounts.get(getAddressKey(chainId, address)) ?? 0,
        markAttempted: plan => {
            attemptedSkeletons.add(getEthereumSkeletonId(plan));
            const addressKey = getAddressKey(plan.chainId, plan.account.address);
            attemptCounts.set(addressKey, (attemptCounts.get(addressKey) ?? 0) + 1);
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
