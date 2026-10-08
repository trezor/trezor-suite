import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ComposeFeeLevelsParams,
    type PrecomposedLevels,
    getExternalComposeOutput,
} from '@trezor/network-module-suite-common-types';
import * as tronUtils from '@trezor/network-tron/utils';
import { BigNumber } from '@trezor/utils';

import { buildTransferContract, buildTriggerContract } from './buildContract';
import { calculate } from './calculate';
import { computeBandwidthFeeLevel } from './computeBandwidthFeeLevel';
import {
    type EstimateContractCallFeeLevelDeps,
    createEstimateContractCallFeeLevel,
} from './createEstimateContractCallFeeLevel';
import { type IsNewTronAccountDeps, createIsNewTronAccount } from './createIsNewTronAccount';
import { resolveCalldata } from './resolveCalldata';
import { type TronSendConfig, readTronSendAccountMisc } from './types';

export type ComposeTronFeeLevelsDeps = GetTrezorConnectDep<'tronComposeTransaction'> &
    EstimateContractCallFeeLevelDeps &
    IsNewTronAccountDeps;

export type ComposeTronFeeLevelsParams = ComposeFeeLevelsParams & { config: TronSendConfig };

export type ComposeTronFeeLevels = (
    params: ComposeTronFeeLevelsParams,
) => Promise<PrecomposedLevels>;

// Dummy block values — block fields are fixed-size in protobuf so bandwidth is identical
// to what we'd get with real block data.
const DUMMY_BLOCK_HASH = '0'.repeat(64);
const DUMMY_BLOCK_HEIGHT = 0;

/**
 * Tron has one fee level: the bandwidth a transfer burns, or the energy a contract call needs,
 * plus the activation fee of a recipient that does not exist yet and the memo fee.
 */
export const createComposeTronFeeLevels = (
    deps: ComposeTronFeeLevelsDeps,
): ComposeTronFeeLevels => {
    const estimateContractCallFeeLevel = createEstimateContractCallFeeLevel(deps);
    const isNewTronAccount = createIsNewTronAccount(deps);

    return async ({ account, draft, context, config }) => {
        const { symbol } = account;
        const identity = account.deviceState;
        const fail = (message: string) => new ChainSendError('compose-failed', symbol, message);

        const composeOutputs = getExternalComposeOutput(draft, account, config);

        if (!composeOutputs) {
            throw fail('Unable to compose output.');
        }

        const { output, tokenInfo: token, decimals } = composeOutputs;
        const to =
            'address' in output && output.address
                ? output.address
                : (context.feeEstimationRecipient ?? account.descriptor);

        const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';
        const fallbackAmount = token
            ? new BigNumber(token.balance ?? '0').shiftedBy(token.decimals).toString()
            : account.availableBalance;
        const amountForEstimation =
            isSendMax || !('amount' in output) || !output.amount ? fallbackAmount : output.amount;

        const ownerHex = tronUtils.tronAddressToHex(account.descriptor);
        const recipientHex = token
            ? tronUtils.tronAddressToHex(token.contract)
            : tronUtils.tronAddressToHex(to);

        if (!ownerHex || !recipientHex) {
            throw fail('Invalid address checksum.');
        }

        const userCallDataHex = draft.transactionData
            ? draft.transactionData.replace(/^0x/, '')
            : '';

        const calldata = resolveCalldata({
            token,
            outputAddress: to,
            amountInSubunits: amountForEstimation,
            userCallDataHex,
        });

        if ('error' in calldata) {
            throw fail(calldata.error);
        }

        const contract =
            calldata.data !== null
                ? buildTriggerContract({ ownerHex, recipientHex, data: calldata.data })
                : buildTransferContract({ ownerHex, recipientHex, amount: amountForEstimation });

        const noteHex = draft.destinationTag
            ? Buffer.from(draft.destinationTag, 'utf8').toString('hex')
            : undefined;

        const bandwidthEstimate = await deps.getTrezorConnect().tronComposeTransaction({
            contract,
            blockHash: DUMMY_BLOCK_HASH,
            blockHeight: DUMMY_BLOCK_HEIGHT,
            data: noteHex || undefined,
        });

        if (!bandwidthEstimate.success) {
            throw fail(bandwidthEstimate.error.message);
        }

        const bytes = bandwidthEstimate.payload.bandwidth;

        const [firstComposeOutput] = draft.outputs;

        if (!firstComposeOutput) {
            throw fail('Missing transaction output.');
        }

        const isNewAccount =
            calldata.data === null &&
            (context.assumeNewAccount ||
                (to !== account.descriptor &&
                    (await isNewTronAccount({ address: to, symbol, identity }))));

        const tronResources = readTronSendAccountMisc(account)?.tronResources;
        const feeLevel =
            calldata.data !== null
                ? await estimateContractCallFeeLevel({
                      symbol,
                      identity,
                      from: account.descriptor,
                      to: token ? token.contract : to,
                      data: calldata.data,
                  })
                : computeBandwidthFeeLevel({
                      availableStakedBandwidth: tronResources?.availableStakedBandwidth ?? 0,
                      availableFreeBandwidth: tronResources?.availableFreeBandwidth ?? 0,
                      bytes,
                      isNewAccount,
                  });

        if ('error' in feeLevel) {
            throw new ChainSendError(
                'fee-estimation-failed',
                symbol,
                feeLevel.error,
                undefined,
                'fee-estimation',
            );
        }

        const tx = calculate(
            account.availableBalance,
            output,
            feeLevel,
            config.displaySymbol,
            bytes,
            noteHex !== undefined,
            token,
            isNewAccount,
            userCallDataHex,
        );

        if (tx.type !== 'error' && tx.max !== undefined) {
            tx.max = new BigNumber(tx.max).shiftedBy(-decimals).toString();
        }

        if (calldata.data !== null && tx.type !== 'error') {
            tx.estimatedFeeLimit = tx.fee;
        }

        return { normal: tx };
    };
};
