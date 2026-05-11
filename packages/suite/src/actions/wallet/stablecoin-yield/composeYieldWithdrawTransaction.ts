import { numberToHex, toWei } from 'web3-utils';

import { Calldata, asEvmAddress } from '@suite-common/calldata';
import { EVM_VAULT_ADDRESSES } from '@suite-common/earn-stablecoin-api';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    type YieldFlowResolvedData,
    type YieldWithdrawInputUnit,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getAccountIdentity,
    getConvertedOrDefaultFeeInfo,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import type { AppState, Dispatch } from 'src/types/suite';

export type ComposeYieldWithdrawTransactionParams = {
    account: Account & { networkType: 'ethereum' };
    flowData: YieldFlowResolvedData;
    amount: string;
    withdrawInputUnit: YieldWithdrawInputUnit;
    dispatch: Dispatch;
    getState: () => AppState;
};

export const composeYieldWithdrawTransaction = async ({
    account,
    flowData,
    amount,
    withdrawInputUnit,
    dispatch,
    getState,
}: ComposeYieldWithdrawTransactionParams): Promise<string> => {
    const { vault, token, receiptToken } = flowData;
    const vaultAddress = EVM_VAULT_ADDRESSES[vault.id];

    if (!vaultAddress) {
        throw new Error(`Vault ${vault.id} is not supported for self-composed withdraw.`);
    }

    const network = getNetwork(account.symbol);

    if (!network.chainId) {
        throw new Error(`Network ${account.symbol} is missing chainId.`);
    }

    const vaultChainId = Number(vault.chainId);
    if (!Number.isInteger(vaultChainId) || vaultChainId !== network.chainId) {
        throw new Error(
            `Account network chainId ${network.chainId} does not match vault chainId ${vault.chainId}.`,
        );
    }

    const isSharesInput = withdrawInputUnit === 'shares';
    const decimals = isSharesInput ? receiptToken.decimals : token.decimals;
    const ownerAddress = asEvmAddress(account.descriptor);
    const amountSubunits = unitsToSubunits({
        value: asAmountUnit(new BigNumber(amount)),
        decimals,
    });

    const builderResult = isSharesInput
        ? Calldata.evm.erc4626.redeem(
              {
                  shares: amountSubunits,
                  receiver: account.descriptor,
                  owner: account.descriptor,
              },
              { sender: ownerAddress },
          )
        : Calldata.evm.erc4626.withdraw(
              {
                  assets: amountSubunits,
                  receiver: account.descriptor,
                  owner: account.descriptor,
              },
              { sender: ownerAddress },
          );

    if (!builderResult.isValid || !builderResult.data) {
        const issues = builderResult.errors.map(issue => issue.code).join(', ');

        throw new Error(`Failed to encode withdraw calldata${issues ? `: ${issues}` : '.'}`);
    }

    const { nonce } = await dispatch(
        ethereumGetCurrentNonceThunk({ selectedAccount: account }),
    ).unwrap();

    const estimatedFee = await TrezorConnect.blockchainEstimateFee({
        coin: account.symbol,
        identity: getAccountIdentity(account),
        request: {
            blocks: [2],
            specific: {
                from: account.descriptor,
                to: vaultAddress,
                data: builderResult.data,
                value: '0x0',
            },
        },
    });

    const estimatedGasLimit = estimatedFee.success
        ? estimatedFee.payload.levels[0]?.feeLimit
        : undefined;

    if (!estimatedGasLimit) {
        dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));
    }

    const gasLimit = estimatedGasLimit ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: selectRawNetworkFeeInfo(getState(), account.symbol),
    });
    const normalLevel = feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

    if (!normalLevel) {
        throw new Error(`Fee info is not available.`);
    }

    const commonFields = {
        from: account.descriptor,
        to: vaultAddress,
        data: builderResult.data,
        value: '0x0',
        nonce: Number(nonce),
        chainId: network.chainId,
        gasLimit: numberToHex(gasLimit),
    };

    const unsignedTx =
        normalLevel?.maxFeePerGas && normalLevel.maxPriorityFeePerGas
            ? {
                  ...commonFields,
                  type: 2,
                  maxFeePerGas: numberToHex(toWei(normalLevel.maxFeePerGas, 'gwei')),
                  maxPriorityFeePerGas: numberToHex(
                      toWei(normalLevel.maxPriorityFeePerGas, 'gwei'),
                  ),
              }
            : {
                  ...commonFields,
                  gasPrice: numberToHex(toWei(normalLevel.feePerUnit, 'gwei')),
              };

    return JSON.stringify(unsignedTx);
};
