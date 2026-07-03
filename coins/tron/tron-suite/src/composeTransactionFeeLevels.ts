import type {
    AddToastDep,
    ComposeTransactionFeeLevels,
    PrecomposedLevels,
    PrecomposedTransaction,
} from '@network-module/suite-types';

import {
    buildTransferContract,
    buildTriggerContract,
} from '@suite-common/wallet-core/src/send/tron/buildContract';
import { calculate } from '@suite-common/wallet-core/src/send/tron/calculate';
import { estimateContractCallFeeLevel } from '@suite-common/wallet-core/src/send/tron/feeLevel';
import { isNewTronAccount } from '@suite-common/wallet-core/src/send/tron/isNewTronAccount';
import { resolveCalldata } from '@suite-common/wallet-core/src/send/tron/resolveCalldata';
import type { ComposeActionContext, FormState } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    computeBandwidthFeeLevel,
    getAccountIdentity,
    getExternalComposeOutput,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Tron compose dependencies are moved into the network module.
import { tronUtils } from '@trezor/blockchain-link-utils';
// eslint-disable-next-line import/no-extraneous-dependencies -- Temporary bridge until Tron compose dependencies are moved into the network module.
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export type CreateComposeTronTransactionFeeLevelsDeps = AddToastDep;

export const createComposeTronTransactionFeeLevels =
    (deps: CreateComposeTronTransactionFeeLevelsDeps): ComposeTransactionFeeLevels<string> =>
    async ({ formState, composeContext }) => {
        const typedFormState = formState as FormState;
        const typedComposeContext = composeContext as ComposeActionContext;
        const { account, network } = typedComposeContext;

        if (account.networkType !== 'tron') {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Invalid network type.',
            };
        }

        const composeOutputs = getExternalComposeOutput(typedFormState, account, network);

        if (!composeOutputs) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            };
        }

        const { output, tokenInfo: token, decimals } = composeOutputs;
        const to = 'address' in output && output.address ? output.address : account.descriptor;

        const isSendMax = output.type === 'send-max' || output.type === 'send-max-noaddress';
        const fallbackAmount = token
            ? unitsToSubunits({
                  value: asAmountUnit(new BigNumber(token.balance ?? '0')),
                  decimals: token.decimals,
              }).toString()
            : account.availableBalance;
        const amountForEstimation =
            isSendMax || !('amount' in output) || !output.amount ? fallbackAmount : output.amount;

        const ownerHex = tronUtils.tronAddressToHex(account.descriptor);
        const recipientHex = token
            ? tronUtils.tronAddressToHex(token.contract)
            : tronUtils.tronAddressToHex(to);

        if (!ownerHex || !recipientHex) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Invalid address checksum.',
            };
        }

        const dummyBlockHash = '0'.repeat(64);
        const dummyBlockHeight = 0;

        const userCallDataHex = typedFormState.transactionData
            ? typedFormState.transactionData.replace(/^0x/, '')
            : '';

        const calldata = resolveCalldata({
            token,
            outputAddress: to,
            amountInSubunits: amountForEstimation,
            userCallDataHex,
        });

        if ('error' in calldata) {
            return {
                error: 'fee-levels-compose-failed',
                message: calldata.error,
            };
        }

        const contract =
            calldata.data !== null
                ? buildTriggerContract({ ownerHex, recipientHex, data: calldata.data })
                : buildTransferContract({ ownerHex, recipientHex, amount: amountForEstimation });

        const noteHex = typedFormState.destinationTag
            ? Buffer.from(typedFormState.destinationTag, 'utf8').toString('hex')
            : undefined;

        const bandwidthEstimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: dummyBlockHash,
            blockHeight: dummyBlockHeight,
            data: noteHex || undefined,
        });

        if (!bandwidthEstimate.success) {
            return {
                error: 'fee-levels-compose-failed',
                message: bandwidthEstimate.error.message,
            };
        }

        const bytes = bandwidthEstimate.payload.bandwidth;

        const feeLevel =
            calldata.data !== null
                ? await estimateContractCallFeeLevel({
                      symbol: account.symbol,
                      identity: getAccountIdentity(account),
                      from: account.descriptor,
                      to: token ? token.contract : to,
                      data: calldata.data,
                  })
                : computeBandwidthFeeLevel({
                      availableStakedBandwidth:
                          account.misc?.tronResources?.availableStakedBandwidth ?? 0,
                      availableFreeBandwidth:
                          account.misc?.tronResources?.availableFreeBandwidth ?? 0,
                      bytes,
                  });

        if ('error' in feeLevel) {
            deps.addToast({ type: 'estimated-fee-error' });

            return {
                error: 'fee-levels-compose-failed',
                message: feeLevel.error,
            };
        }

        const [firstComposeOutput] = typedFormState.outputs;

        if (!firstComposeOutput) {
            return {
                error: 'fee-levels-compose-failed',
                message: 'Missing transaction output.',
            };
        }

        const isNewAccount =
            calldata.data === null && (await isNewTronAccount(firstComposeOutput.address, account));

        const tx = calculate(
            account.availableBalance,
            output,
            feeLevel,
            account.symbol,
            bytes,
            noteHex !== undefined,
            token,
            isNewAccount,
            userCallDataHex,
        );

        if (tx.type !== 'error' && tx.max !== undefined) {
            tx.max = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(tx.max)),
                decimals,
            }).toString();
        }

        if (calldata.data !== null && tx.type !== 'error') {
            tx.estimatedFeeLimit = tx.fee;
        }

        const resultLevels: PrecomposedLevels = { normal: tx as PrecomposedTransaction };

        return resultLevels;
    };
