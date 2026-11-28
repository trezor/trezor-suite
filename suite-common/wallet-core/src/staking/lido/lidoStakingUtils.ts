import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    getEvmTransactionOperation,
    isPending,
    isSignedByAccount,
} from '@suite-common/wallet-utils';
import {
    Calldata,
    LIDO_MAX_STETH_WITHDRAWAL_AMOUNT,
    LIDO_MIN_STETH_WITHDRAWAL_AMOUNT,
    LIDO_REFERRAL_ADDRESS,
    type LidoDeployment,
    type LidoWithdrawalRequestStatus,
    asEvmAddress,
} from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

const WSTETH_DECIMALS = 18;

// The wstETH value moves with every oracle report, so a request is kept a little under the 1000
// stETH the queue accepts: a report between the fee estimate and the block must not push it over.
const MAX_WITHDRAWAL_REQUEST_STETH_AMOUNT = new BigNumber(
    LIDO_MAX_STETH_WITHDRAWAL_AMOUNT.toString(),
)
    .times(999)
    .div(1000);

const MIN_WITHDRAWAL_REQUEST_STETH_AMOUNT = new BigNumber(
    LIDO_MIN_STETH_WITHDRAWAL_AMOUNT.toString(),
);

export type LidoTransactionData = {
    to: string;
    data: string;
    value?: string;
};

export type LidoWithdrawalRequest = {
    id: string;
    amountOfStETH: string;
    requestedAt: number;
    isFinalized: boolean;
};

export type ClaimableLidoWithdrawalRequest = LidoWithdrawalRequest & {
    // The checkpoint the claim has to name.
    hint: string;
    // What the claim pays out, in wei of ETH: a slashing can leave it under the stETH requested.
    claimableAmount: string;
};

export type LidoWithdrawals = {
    pendingRequests: readonly LidoWithdrawalRequest[];
    claimableRequests: readonly ClaimableLidoWithdrawalRequest[];
};

export type LidoTransactionKind = 'stake' | 'approve' | 'request-withdrawal' | 'claim';

type ConvertWstETHToETHParams = {
    wstETHAmount: string;
    wstETHValue: string;
};

/** Amounts are in wei; `wstETHValue` is what one whole wstETH is worth in ETH. */
export const convertWstETHToETH = ({ wstETHAmount, wstETHValue }: ConvertWstETHToETHParams) =>
    new BigNumber(wstETHAmount)
        .times(wstETHValue)
        .shiftedBy(-WSTETH_DECIMALS)
        .integerValue(BigNumber.ROUND_DOWN)
        .toFixed(0);

type ConvertETHToWstETHParams = {
    ethAmount: string;
    wstETHValue: string;
};

export const convertETHToWstETH = ({ ethAmount, wstETHValue }: ConvertETHToWstETHParams) =>
    new BigNumber(ethAmount)
        .shiftedBy(WSTETH_DECIMALS)
        .div(wstETHValue)
        .integerValue(BigNumber.ROUND_DOWN)
        .toFixed(0);

type GetMinLidoWithdrawalAmountParams = {
    wstETHValue: string;
};

/** The least wstETH one request can hand over, in wei: what the queue's 100 wei of stETH is worth. */
export const getMinLidoWithdrawalAmount = ({ wstETHValue }: GetMinLidoWithdrawalAmountParams) =>
    MIN_WITHDRAWAL_REQUEST_STETH_AMOUNT.shiftedBy(WSTETH_DECIMALS)
        .div(wstETHValue)
        .integerValue(BigNumber.ROUND_UP)
        .toFixed(0);

type SplitLidoWithdrawalAmountParams = {
    wstETHAmount: string;
    wstETHValue: string;
};

/**
 * The requests that withdraw the whole amount, each within what the queue accepts. Empty when no
 * such requests exist, as for an amount under the least the queue takes.
 */
export const splitLidoWithdrawalAmount = ({
    wstETHAmount,
    wstETHValue,
}: SplitLidoWithdrawalAmountParams): string[] => {
    if (!new BigNumber(wstETHValue).gt(0)) {
        return [];
    }

    const amount = new BigNumber(wstETHAmount);
    const minRequestAmount = new BigNumber(getMinLidoWithdrawalAmount({ wstETHValue }));
    const maxRequestAmount = new BigNumber(
        convertETHToWstETH({
            ethAmount: MAX_WITHDRAWAL_REQUEST_STETH_AMOUNT.toFixed(0),
            wstETHValue,
        }),
    );

    if (!amount.gte(minRequestAmount) || maxRequestAmount.lt(minRequestAmount)) {
        return [];
    }

    const fullRequestCount = amount.div(maxRequestAmount).integerValue(BigNumber.ROUND_DOWN);
    const tailAmount = amount.minus(maxRequestAmount.times(fullRequestCount));
    const fullRequests = Array.from({ length: fullRequestCount.toNumber() }, () =>
        maxRequestAmount.toFixed(0),
    );

    if (tailAmount.isZero()) {
        return fullRequests;
    }

    if (tailAmount.gte(minRequestAmount)) {
        return [...fullRequests, tailAmount.toFixed(0)];
    }

    // The queue would refuse the tail as a request of its own and with it the whole transaction,
    // so the last full request gives up what makes the tail the least the queue takes.
    const reducedRequestAmount = maxRequestAmount.plus(tailAmount).minus(minRequestAmount);

    if (reducedRequestAmount.lt(minRequestAmount)) {
        return [];
    }

    return [
        ...fullRequests.slice(0, -1),
        reducedRequestAmount.toFixed(0),
        minRequestAmount.toFixed(0),
    ];
};

type LidoStakeBounds = {
    // In wei, as every amount here.
    availableBalance: string;
    // Kept aside for the fee of the stake and of a later withdrawal.
    feeBufferBalance: string;
    // The most the product ever takes.
    maxStakeAmount: string;
    // What Lido takes right now; null while it is not read, when only the chain can refuse.
    stakeLimit: string | null;
};

const getSpendableStakeAmount = ({ availableBalance, feeBufferBalance }: LidoStakeBounds) =>
    BigNumber.max(new BigNumber(availableBalance).minus(feeBufferBalance), 0);

const getProtocolMaxStakeAmount = ({ maxStakeAmount, stakeLimit }: LidoStakeBounds) =>
    stakeLimit === null ? new BigNumber(maxStakeAmount) : BigNumber.min(maxStakeAmount, stakeLimit);

/** The most the account can stake, in wei: the amount Max fills in and a typed one is held to. */
export const getLidoMaxStakeAmount = (bounds: LidoStakeBounds): string =>
    BigNumber.min(getSpendableStakeAmount(bounds), getProtocolMaxStakeAmount(bounds)).toFixed(0);

export type LidoStakeAmountIssue =
    'insufficient-balance' | 'fee-reserve' | 'staking-paused' | 'stake-limit';

type GetLidoStakeAmountIssueParams = LidoStakeBounds & {
    ethAmount: string;
};

/** Why the amount cannot be staked; null for an amount within every bound. */
export const getLidoStakeAmountIssue = ({
    ethAmount,
    ...bounds
}: GetLidoStakeAmountIssueParams): LidoStakeAmountIssue | null => {
    const amount = new BigNumber(ethAmount);

    if (amount.gt(bounds.availableBalance)) {
        return 'insufficient-balance';
    }

    if (amount.gt(getSpendableStakeAmount(bounds))) {
        return 'fee-reserve';
    }

    if (bounds.stakeLimit !== null && new BigNumber(bounds.stakeLimit).isZero()) {
        return 'staking-paused';
    }

    return amount.gt(getProtocolMaxStakeAmount(bounds)) ? 'stake-limit' : null;
};

type BuildLidoStakeTransactionParams = {
    deployment: LidoDeployment;
    ethAmount: string;
};

/** Stakes ETH and returns wstETH in one transaction, attributed to the Trezor referral address. */
export const buildLidoStakeTransaction = ({
    deployment,
    ethAmount,
}: BuildLidoStakeTransactionParams): LidoTransactionData | null => {
    const { data } = Calldata.evm.lido.stakeETH.encode({ referral: LIDO_REFERRAL_ADDRESS });

    if (data === null || !new BigNumber(ethAmount).gt(0)) {
        return null;
    }

    return {
        to: deployment.wstETHReferralStaker,
        data,
        value: `0x${BigInt(ethAmount).toString(16)}`,
    };
};

type BuildLidoApproveTransactionParams = {
    deployment: LidoDeployment;
    owner: string;
    wstETHAmount: string;
};

/** Lets the withdrawal queue take the wstETH a withdrawal request hands over. */
export const buildLidoApproveTransaction = ({
    deployment,
    owner,
    wstETHAmount,
}: BuildLidoApproveTransactionParams): LidoTransactionData | null => {
    const { data } = Calldata.evm.erc20.approve.encode(
        { spender: deployment.withdrawalQueue, amount: new BigNumber(wstETHAmount) },
        { sender: asEvmAddress(owner) },
    );

    return data === null ? null : { to: deployment.wstETH, data };
};

type BuildLidoRequestWithdrawalsTransactionParams = {
    deployment: LidoDeployment;
    owner: string;
    wstETHAmounts: readonly string[];
};

export const buildLidoRequestWithdrawalsTransaction = ({
    deployment,
    owner,
    wstETHAmounts,
}: BuildLidoRequestWithdrawalsTransactionParams): LidoTransactionData | null => {
    if (wstETHAmounts.length === 0) {
        return null;
    }

    const { data } = Calldata.evm.lido.requestWithdrawalsWstETH.encode(
        { amounts: wstETHAmounts.map(amount => new BigNumber(amount)), owner },
        { sender: asEvmAddress(owner) },
    );

    return data === null ? null : { to: deployment.withdrawalQueue, data };
};

// The selector, two array heads and two lengths take 132 bytes. Each NFT adds 64 bytes.
// 93 requests fit within the firmware's 6,144-byte clear-signing limit.
export const LIDO_MAX_CLAIM_REQUESTS_PER_TRANSACTION = 93;

type BuildLidoClaimWithdrawalsTransactionParams = {
    deployment: LidoDeployment;
    requestIds: readonly string[];
    hints: readonly string[];
};

export const buildLidoClaimWithdrawalsTransaction = ({
    deployment,
    requestIds,
    hints,
}: BuildLidoClaimWithdrawalsTransactionParams): LidoTransactionData | null => {
    if (requestIds.length === 0 || requestIds.length > LIDO_MAX_CLAIM_REQUESTS_PER_TRANSACTION) {
        return null;
    }

    const { data } = Calldata.evm.lido.claimWithdrawals.encode({
        requestIds: requestIds.map(id => new BigNumber(id)),
        hints: hints.map(hint => new BigNumber(hint)),
    });

    return data === null ? null : { to: deployment.withdrawalQueue, data };
};

type ToLidoWithdrawalRequestsParams = {
    requestIds: readonly bigint[];
    statuses: readonly LidoWithdrawalRequestStatus[];
    owner: string;
};

/** The requests still to be finalized or claimed, in the ascending order a claim needs. */
export const toLidoWithdrawalRequests = ({
    requestIds,
    statuses,
    owner,
}: ToLidoWithdrawalRequestsParams): LidoWithdrawalRequest[] => {
    const expectedOwner = owner.toLowerCase();

    return requestIds
        .flatMap((id, index) => {
            const status = statuses[index];

            if (
                status === undefined ||
                status.isClaimed ||
                status.owner.toLowerCase() !== expectedOwner
            ) {
                return [];
            }

            return [{ id, status }];
        })
        .toSorted((a, b) => (a.id < b.id ? -1 : 1))
        .map(({ id, status }) => ({
            id: id.toString(),
            amountOfStETH: status.amountOfStETH.toString(),
            requestedAt: Number(status.timestamp) * 1000,
            isFinalized: status.isFinalized,
        }));
};

type ToClaimableLidoWithdrawalRequestsParams = {
    // The finalized requests in the order the queue was asked about them.
    requests: readonly LidoWithdrawalRequest[];
    hints: readonly bigint[];
    claimableAmounts: readonly bigint[];
};

/** Null when the queue did not answer for exactly the requests it was asked about. */
export const toClaimableLidoWithdrawalRequests = ({
    requests,
    hints,
    claimableAmounts,
}: ToClaimableLidoWithdrawalRequestsParams): ClaimableLidoWithdrawalRequest[] | null => {
    if (hints.length !== requests.length || claimableAmounts.length !== requests.length) {
        return null;
    }

    return requests.flatMap((request, index) => {
        const hint = hints[index];
        const claimableAmount = claimableAmounts[index];

        if (hint === undefined || claimableAmount === undefined) return [];

        return [{ ...request, hint: hint.toString(), claimableAmount: claimableAmount.toString() }];
    });
};

/** What claiming the requests pays out together, in wei of ETH. */
export const getLidoClaimableAmount = (
    claimableRequests: readonly ClaimableLidoWithdrawalRequest[],
): string =>
    claimableRequests
        .reduce((sum, { claimableAmount }) => sum.plus(claimableAmount), new BigNumber(0))
        .toFixed(0);

type GetLidoStakeReceivedAmountParams = {
    deployment: LidoDeployment;
    transaction: WalletAccountTransaction;
};

/** The wstETH a mined stake brought in, in wei; null while its token transfers are not known. */
export const getLidoStakeReceivedAmount = ({
    deployment,
    transaction,
}: GetLidoStakeReceivedAmountParams): string | null => {
    const receivedTransfers = transaction.tokens.filter(
        ({ type, contract }) => type === 'recv' && contract.toLowerCase() === deployment.wstETH,
    );

    if (receivedTransfers.length === 0) {
        return null;
    }

    return receivedTransfers
        .reduce((sum, { amount }) => sum.plus(amount), new BigNumber(0))
        .toFixed(0);
};

type GetLidoTransactionKindParams = {
    deployment: LidoDeployment;
    to: string | undefined;
    data: string | undefined;
};

/**
 * The Lido call a transaction makes, told by its target and its calldata together: the selectors
 * alone are shared with other contracts.
 */
export const getLidoTransactionKind = ({
    deployment,
    to,
    data,
}: GetLidoTransactionKindParams): LidoTransactionKind | null => {
    const target = to?.toLowerCase();

    if (target === deployment.wstETHReferralStaker) {
        return Calldata.evm.lido.stakeETH.decode(data) === null ? null : 'stake';
    }

    if (target === deployment.wstETH) {
        const spender = Calldata.evm.erc20.approve.decode(data)?.spender.toLowerCase();

        return spender === deployment.withdrawalQueue ? 'approve' : null;
    }

    if (target !== deployment.withdrawalQueue) {
        return null;
    }

    if (Calldata.evm.lido.requestWithdrawalsWstETH.decode(data) !== null) {
        return 'request-withdrawal';
    }

    return Calldata.evm.lido.claimWithdrawals.decode(data) === null ? null : 'claim';
};

type GetAccountTransactionLidoKindParams = {
    deployment: LidoDeployment;
    transaction: WalletAccountTransaction;
};

export const getAccountTransactionLidoKind = ({
    deployment,
    transaction,
}: GetAccountTransactionLidoKindParams): LidoTransactionKind | null => {
    const operation = getEvmTransactionOperation(transaction);

    return getLidoTransactionKind({ deployment, to: operation?.to, data: operation?.data });
};

type FindPendingLidoTransactionParams = {
    deployment: LidoDeployment;
    transactions: readonly WalletAccountTransaction[];
    kind: LidoTransactionKind;
};

/**
 * The account's own Lido transaction of the kind that is still to be mined. Read from the
 * account's transactions, so a flow finds it again after it was left and reopened.
 */
export const findPendingLidoTransaction = ({
    deployment,
    transactions,
    kind,
}: FindPendingLidoTransactionParams): WalletAccountTransaction | undefined =>
    transactions.find(
        transaction =>
            isPending(transaction) &&
            isSignedByAccount(transaction) &&
            getAccountTransactionLidoKind({ deployment, transaction }) === kind,
    );
