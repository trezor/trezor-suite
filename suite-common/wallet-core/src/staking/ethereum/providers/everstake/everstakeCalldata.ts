import { type BaseStakeType } from '@suite-common/wallet-types';
import { fromWei } from '@suite-common/wallet-utils';
import { Calldata, Verifier, type VerifyIssue } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { WALLET_SDK_SOURCE } from '../../../shared/stakingConstants';
import { type StakingCalldataVerification } from '../types';

const encodeCalldata = <D extends string>(
    label: string,
    result: { isValid: boolean; data: D | null },
): D => {
    if (!result.isValid || !result.data) {
        throw new Error(`Failed to encode ${label} calldata`);
    }

    return result.data;
};

const verifyCalldata = (label: string, result: { isValid: boolean; issues: VerifyIssue[] }) => {
    if (!result.isValid) {
        throw new Error(`${label} calldata verification failed: ${JSON.stringify(result.issues)}`);
    }
};

export const buildStakeData = (source: string = WALLET_SDK_SOURCE) => {
    const data = encodeCalldata(
        'stake',
        Calldata.evm.everstake.stake.encode({ source: new BigNumber(source) }),
    );

    verifyCalldata('stake', Verifier.evm.everstake.stake(data, { source: BigInt(source) }));

    return data;
};

export const buildUnstakeData = (
    amountWei: string,
    interchanges: number,
    source: string = WALLET_SDK_SOURCE,
) => {
    const data = encodeCalldata(
        'unstake',
        Calldata.evm.everstake.unstake.encode({
            value: new BigNumber(amountWei),
            allowedInterchangeNum: new BigNumber(interchanges),
            source: new BigNumber(source),
        }),
    );

    verifyCalldata(
        'unstake',
        Verifier.evm.everstake.unstake(data, {
            value: BigInt(amountWei),
            allowedInterchangeNum: interchanges,
            source: BigInt(source),
        }),
    );

    return data;
};

export const buildClaimWithdrawRequestData = () => {
    const data = encodeCalldata(
        'claimWithdrawRequest',
        Calldata.evm.everstake.claimWithdrawRequest.encode({}),
    );

    verifyCalldata('claimWithdrawRequest', Verifier.evm.everstake.claimWithdrawRequest(data, {}));

    return data;
};

// Re-verifies calldata that was produced at compose time. Returns the Verifier issues so callers
// can fail with a specific message instead of throwing. For unstake the user-typed amount is not
// persisted in the form draft, so only the function selector and the SDK `source` field are
// checked, enough to reject calldata that targets a different function or wasn't produced by our SDK.
export const verifyEverstakeCalldata = (
    label: BaseStakeType,
    calldata: string,
    source: string,
): StakingCalldataVerification => {
    const data = calldata as `0x${string}`;
    const sourceBigInt = BigInt(source);

    switch (label) {
        case 'stake':
            return Verifier.evm.everstake.stake(data, { source: sourceBigInt });
        case 'unstake':
            return Verifier.evm.everstake.unstake(
                data,
                { value: 0n, allowedInterchangeNum: 0, source: sourceBigInt },
                ['source'],
            );
        case 'claim':
            return Verifier.evm.everstake.claimWithdrawRequest(data, {});
        default:
            return { isValid: false, issues: [{ code: 'SIGNATURE_MISMATCH', field: null }] };
    }
};

export const getUnstakeAmountFromCalldata = (calldata: string): string | null => {
    const decoded = Calldata.evm.everstake.unstake.decode(calldata);

    if (!decoded) return null;

    return fromWei(`${decoded.value}`).toEther();
};
