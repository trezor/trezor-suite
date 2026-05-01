import { decodeFunctionResult } from 'viem';
import { fromWei, numberToHex, toWei } from 'web3-utils';

import { Calldata, EVM_ABI, Verifier, type VerifyIssue } from '@suite-common/calldata';
import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    DAYS_TO_ADD_TO_POOL_DEFAULT,
    DEFAULT_PAYMENT,
    MIN_ETH_AMOUNT_FOR_STAKING,
    STAKE_GAS_LIMIT_RESERVE,
    UNSTAKE_INTERCHANGES,
    WALLET_SDK_SOURCE,
} from '@suite-common/wallet-constants';
import {
    type PrecomposedLevels,
    type StakeType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getEthereumEstimateFeeParams,
    isPending,
    isSupportedEthStakingNetworkSymbol,
    sanitizeHex,
    secondsToDays,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type EthereumTransaction,
    type EthereumTransactionEIP1559,
    type InternalTransfer,
} from '@trezor/connect';
import { type BlockchainEstimatedFee } from '@trezor/connect-common/src/types/api/blockchainEstimateFee';
import { type Ok, type PartialRecord } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    ETH_NETWORK_ADDRESSES,
    type EthNetworkAddresses,
} from '../constants/ethereumNetworkAddresses';
import {
    type EthNetwork,
    type GetStakeFormsDefaultValuesParams,
    type GetStakeTxGasLimitParams,
    type PrepareClaimEthTxParams,
    type PrepareStakeEthTxParams,
    type PrepareUnstakeEthTxParams,
    type StakeTxBaseArgs,
} from '../types';

const STAKE_SOURCE = new BigNumber(WALLET_SDK_SOURCE);
const STAKE_SOURCE_BIGINT = BigInt(WALLET_SDK_SOURCE);

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

const buildStakeData = () => {
    const data = encodeCalldata('stake', Calldata.evm.everstake.stake({ source: STAKE_SOURCE }));
    verifyCalldata('stake', Verifier.evm.everstake.stake(data, { source: STAKE_SOURCE_BIGINT }));

    return data;
};

const buildUnstakeData = (amountWei: string, interchanges: number) => {
    const data = encodeCalldata(
        'unstake',
        Calldata.evm.everstake.unstake({
            value: new BigNumber(amountWei),
            allowedInterchangeNum: new BigNumber(interchanges),
            source: STAKE_SOURCE,
        }),
    );
    verifyCalldata(
        'unstake',
        Verifier.evm.everstake.unstake(data, {
            value: BigInt(amountWei),
            allowedInterchangeNum: interchanges,
            source: STAKE_SOURCE_BIGINT,
        }),
    );

    return data;
};

const buildClaimWithdrawRequestData = () => {
    const data = encodeCalldata(
        'claimWithdrawRequest',
        Calldata.evm.everstake.claimWithdrawRequest({}),
    );
    verifyCalldata('claimWithdrawRequest', Verifier.evm.everstake.claimWithdrawRequest(data, {}));

    return data;
};

// Re-verifies calldata that was produced at compose time. Returns the Verifier issues so callers can fail with a specific message instead of throwing. For unstake the user-typed amount is not persisted in the form draft, so only the function selector and the SDK `source` field are checked — enough to reject calldata that targets a different function or wasn't produced by our SDK.
export const verifyEthereumStakingCalldata = ({
    stakeType,
    calldata,
}: {
    stakeType: StakeType;
    calldata: string;
}): { isValid: boolean; issues: VerifyIssue[] } => {
    const data = calldata as `0x${string}`;

    if (stakeType === 'stake') {
        return Verifier.evm.everstake.stake(data, { source: STAKE_SOURCE_BIGINT });
    }
    if (stakeType === 'unstake') {
        return Verifier.evm.everstake.unstake(
            data,
            { value: 0n, allowedInterchangeNum: 0, source: STAKE_SOURCE_BIGINT },
            ['source'],
        );
    }
    if (stakeType === 'claim') {
        return Verifier.evm.everstake.claimWithdrawRequest(data, {});
    }

    return { isValid: false, issues: [{ code: 'SIGNATURE_MISMATCH', field: null }] };
};

export const getEthNetworkForWalletSdk = (
    symbol: NetworkSymbol | 'unknown' | undefined,
): EthNetwork | null => {
    const ethNetworks: PartialRecord<NetworkSymbol, EthNetwork> = {
        thod: 'hoodi',
        eth: 'mainnet',
    };

    return (symbol && symbol !== 'unknown' ? ethNetworks[symbol] : null) ?? null;
};

export const getEthNetworkAddresses = (symbol: NetworkSymbol): EthNetworkAddresses | null => {
    const ethNetwork = getEthNetworkForWalletSdk(symbol);

    return ethNetwork ? ETH_NETWORK_ADDRESSES[ethNetwork] : null;
};

export const getAdjustedGasLimitConsumption = (estimatedFee: Ok<BlockchainEstimatedFee>) =>
    new BigNumber(estimatedFee.payload.levels[0].feeLimit || '')
        .plus(STAKE_GAS_LIMIT_RESERVE)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();

export const stake = async ({
    from,
    amount,
    symbol,
    identity,
    feeLimit,
}: StakeTxBaseArgs & {
    amount: string;
}) => {
    const amountWei = toWei(amount, 'ether');

    if (new BigNumber(amount).lt(MIN_ETH_AMOUNT_FOR_STAKING)) {
        throw new Error(
            `Min amount ${MIN_ETH_AMOUNT_FOR_STAKING} ${getNetworkDisplaySymbol(symbol)}`,
        );
    }

    try {
        const ethAddresses = getEthNetworkAddresses(symbol);
        if (!ethAddresses) {
            throw new Error(`Unsupported staking network symbol: ${symbol}`);
        }
        const { addressContractPool } = ethAddresses;
        const data = buildStakeData();

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
            identity,
            request: {
                blocks: [2],
                specific: {
                    from,
                    ...getEthereumEstimateFeeParams(addressContractPool, amount, undefined, data),
                },
            },
        });

        if (!estimatedFee.success) {
            throw new Error(estimatedFee.error.message);
        }

        // Create the transaction
        return {
            from,
            to: addressContractPool,
            value: amountWei,
            gasLimit: feeLimit ?? getAdjustedGasLimitConsumption(estimatedFee),
            data,
        };
    } catch (e) {
        throw new Error(e);
    }
};

export const unstake = async ({
    from,
    amount,
    identity,
    interchanges,
    symbol,
    feeLimit,
}: StakeTxBaseArgs & {
    amount: string;
    interchanges: number;
}) => {
    try {
        const accountInfo = await TrezorConnect.getAccountInfo({
            coin: symbol,
            identity,
            details: 'tokenBalances',
            descriptor: from,
        });
        if (!accountInfo.success) {
            throw new Error(accountInfo.error.message);
        }

        const { autocompoundBalance } = accountInfo.payload?.misc?.stakingPools?.[0] ?? {};
        if (!autocompoundBalance) {
            throw new Error('Failed to get the autocompound balance');
        }

        const balance = new BigNumber(fromWei(autocompoundBalance, 'ether'));
        if (balance.lt(amount)) {
            throw new Error(`Max Amount For Unstake ${balance}`);
        }

        const UINT16_MAX = 65535;
        if (interchanges > UINT16_MAX) {
            interchanges = UINT16_MAX;
        }

        const amountWei = toWei(amount, 'ether');
        const ethAddresses = getEthNetworkAddresses(symbol);
        if (!ethAddresses) {
            throw new Error(`Unsupported staking network symbol: ${symbol}`);
        }
        const { addressContractPool } = ethAddresses;
        const data = buildUnstakeData(amountWei, interchanges);

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
            identity,
            request: {
                blocks: [2],
                specific: {
                    from,
                    ...getEthereumEstimateFeeParams(addressContractPool, '0', undefined, data),
                },
            },
        });
        if (!estimatedFee.success) {
            throw new Error(estimatedFee.error.message);
        }

        // Create the transaction
        return {
            from,
            value: '0',
            to: addressContractPool,
            gasLimit: feeLimit ?? getAdjustedGasLimitConsumption(estimatedFee),
            data,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const claimWithdrawRequest = async ({
    from,
    symbol,
    identity,
    feeLimit,
}: StakeTxBaseArgs) => {
    try {
        const accountInfo = await TrezorConnect.getAccountInfo({
            coin: symbol,
            identity,
            details: 'tokenBalances',
            descriptor: from,
        });
        if (!accountInfo.success) {
            throw new Error(accountInfo.error.message);
        }

        const { withdrawTotalAmount, claimableAmount } =
            accountInfo.payload?.misc?.stakingPools?.[0] ?? {};
        if (!withdrawTotalAmount || !claimableAmount) {
            throw new Error('Failed to get the claimable or withdraw total amount');
        }

        const requested = new BigNumber(fromWei(withdrawTotalAmount, 'ether'));
        const readyForClaim = new BigNumber(fromWei(claimableAmount, 'ether'));
        if (requested.isZero()) {
            throw new Error('No amount requested for unstake');
        }
        if (!readyForClaim.eq(requested)) throw new Error('Unstake request not filled yet');

        const ethAddresses = getEthNetworkAddresses(symbol);
        if (!ethAddresses) {
            throw new Error(`Unsupported staking network symbol: ${symbol}`);
        }
        const { addressContractAccounting } = ethAddresses;
        const data = buildClaimWithdrawRequestData();

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
            identity,
            request: {
                blocks: [2],
                specific: {
                    from,
                    ...getEthereumEstimateFeeParams(
                        addressContractAccounting,
                        '0',
                        undefined,
                        data,
                    ),
                },
            },
        });
        if (!estimatedFee.success) {
            throw new Error(estimatedFee.error.message);
        }

        return {
            from,
            to: addressContractAccounting,
            value: '0',
            gasLimit: feeLimit ?? getAdjustedGasLimitConsumption(estimatedFee),
            data,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const getStakeFormsDefaultValues = ({
    address,
    stakeType,
    amount,
}: GetStakeFormsDefaultValuesParams) => ({
    fiatInput: '',
    cryptoInput: amount || '',
    outputs: [
        {
            ...DEFAULT_PAYMENT,
            address,
            amount: amount || '',
        },
    ],
    options: ['broadcast'],

    stakeType,
    ethereumNonce: '',
    ethereumDataAscii: '',
    transactionData: '',

    estimatedFeeLimit: undefined,
    feeLimit: '',
    feePerUnit: '',
    selectedFee: undefined,

    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

export const transformTx = (
    tx: any,
    nonce: string,
    chainId: number,
    gasPrice?: string,
    maxFeePerGas?: string,
    maxPriorityFeePerGas?: string,
): EthereumTransaction | EthereumTransactionEIP1559 => {
    let result: EthereumTransaction | EthereumTransactionEIP1559;

    const commonTxData = {
        to: tx.to,
        // in send form, the amount is in ether, here in wei because it is converted earlier in stake, unstake, claimToWithdraw methods
        value: numberToHex(tx.value),
        chainId,
        nonce: numberToHex(nonce),
        gasLimit: numberToHex(tx.gasLimit),
        data: sanitizeHex(tx.data),
    };

    if (maxFeePerGas) {
        result = {
            ...commonTxData,
            gasPrice: undefined,
            maxFeePerGas: numberToHex(toWei(maxFeePerGas, 'gwei')),
            maxPriorityFeePerGas: numberToHex(toWei(maxPriorityFeePerGas || '0', 'gwei')),
        } as EthereumTransactionEIP1559;
    } else if (gasPrice) {
        result = {
            ...commonTxData,
            gasPrice: numberToHex(toWei(gasPrice, 'gwei')),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
        } as EthereumTransaction;
    } else {
        throw new Error('No gas price or maxFeePerGas and maxPriorityFeePerGas provided');
    }

    return result;
};

export type PrepareStakeEthTxResponse =
    | {
          success: true;
          tx: EthereumTransaction | EthereumTransactionEIP1559;
      }
    | {
          success: false;
          errorMessage: string;
      };

export const prepareStakeEthTx = async ({
    symbol,
    from,
    amount,
    gasPrice,
    nonce,
    chainId,
    feeLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    identity,
}: PrepareStakeEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await stake({
            from,
            amount,
            symbol,
            identity,
            feeLimit,
        });

        const transformedTx = transformTx(
            tx,
            nonce,
            chainId,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
        );

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareUnstakeEthTx = async ({
    symbol,
    from,
    amount,
    gasPrice,
    nonce,
    chainId,
    identity,
    interchanges = UNSTAKE_INTERCHANGES,
    feeLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
}: PrepareUnstakeEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await unstake({
            from,
            amount,
            identity,
            interchanges,
            symbol,
            feeLimit,
        });

        const transformedTx = transformTx(
            tx,
            nonce,
            chainId,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
        );

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export const prepareClaimEthTx = async ({
    symbol,
    identity,
    from,
    gasPrice,
    nonce,
    chainId,
    feeLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
}: PrepareClaimEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await claimWithdrawRequest({ from, symbol, identity, feeLimit });
        const transformedTx = transformTx(
            tx,
            nonce,
            chainId,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
        );

        return {
            success: true,
            tx: transformedTx,
        };
    } catch (e) {
        console.error(e);

        return {
            success: false,
            errorMessage: e.message,
        };
    }
};

export type GetStakeTxGasLimitResponse =
    | {
          success: true;
          gasLimit: string;
      }
    | {
          success: false;
          error: PrecomposedLevels; // TODO: wrong error
      };

export const getStakeTxGasLimit = async ({
    stakeType,
    from,
    amount,
    symbol,
    identity,
}: GetStakeTxGasLimitParams): Promise<GetStakeTxGasLimitResponse> => {
    try {
        let txData;
        if (stakeType === 'stake') {
            txData = await stake({ from, amount, symbol, identity });
        }
        if (stakeType === 'unstake') {
            // Increase allowedInterchangeNum to enable instant unstaking.
            txData = await unstake({
                from,
                amount,
                interchanges: UNSTAKE_INTERCHANGES,
                symbol,
                identity,
            });
        }
        if (stakeType === 'claim') {
            txData = await claimWithdrawRequest({ from, symbol, identity });
        }

        if (!txData) {
            throw new Error('No tx data');
        }

        return {
            success: true,
            gasLimit: txData.gasLimit.toString(),
        };
    } catch (error) {
        console.error(error);

        return {
            success: false,
            error: {
                // TODO: get rid of generic error
                normal: {
                    error: 'INCORRECT-FEE-RATE',
                    errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
                    type: 'error',
                },
            },
        };
    }
};

export const getDaysToAddToPool = (
    stakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthValidatorsQueue | null,
) => {
    if (
        !validatorsQueue ||
        validatorsQueue?.addingDelay === undefined ||
        validatorsQueue?.activationTime === undefined
    ) {
        return undefined;
    }

    const lastTxBlockTime = stakeTxs[0]?.blockTime;

    if (!lastTxBlockTime) {
        return undefined;
    }

    const now = Math.floor(Date.now() / 1000);

    const secondsToWait =
        lastTxBlockTime + validatorsQueue.addingDelay + validatorsQueue.activationTime - now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToUnstake = (
    unstakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthValidatorsQueue | null,
) => {
    if (typeof validatorsQueue?.withdrawTime !== 'number') {
        return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const lastTxBlockTime = unstakeTxs[0]?.blockTime || now;

    const secondsToWait =
        lastTxBlockTime + validatorsQueue.withdrawTime + (validatorsQueue?.exitTime || 0) - now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToAddToPoolInitial = (validatorsQueue?: EthValidatorsQueue | null) => {
    if (
        !validatorsQueue ||
        validatorsQueue?.addingDelay === undefined ||
        validatorsQueue?.activationTime === undefined
    ) {
        return DAYS_TO_ADD_TO_POOL_DEFAULT;
    }

    const secondsToWait = validatorsQueue.addingDelay + validatorsQueue.activationTime;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getInstantStakeType = (
    internalTransfer: Pick<InternalTransfer, 'from' | 'to'>,
    address?: string,
    symbol?: NetworkSymbol,
): StakeType | null => {
    if (!address || !symbol) return null;
    const ethAddresses = getEthNetworkAddresses(symbol);
    if (!ethAddresses) return null;
    const { from, to } = internalTransfer;
    const { addressContractPool, addressContractWithdrawTreasury } = ethAddresses;

    if (from === addressContractPool && to === addressContractWithdrawTreasury) {
        return 'stake';
    }

    if (from === addressContractPool && to === address) {
        return 'unstake';
    }

    if (from === addressContractWithdrawTreasury && to === address) {
        return 'claim';
    }

    return null;
};

export const getChangedInternalTx = (
    prevTxs: WalletAccountTransaction[],
    currentTxs: WalletAccountTransaction[],
    selectedAccountAddress?: string,
    symbol?: NetworkSymbol,
): InternalTransfer | null => {
    if (!selectedAccountAddress || !symbol) return null;

    const prevPendingTxs = prevTxs.filter(tx => isPending(tx));
    const currentSentTxs = currentTxs.filter(
        tx => tx.type === 'sent' && tx.internalTransfers.length > 0,
    );
    const changedTx = currentSentTxs.find(currTx =>
        prevPendingTxs.some(prevTx => currTx.txid === prevTx.txid),
    );
    if (!changedTx) return null;

    const internalTransfer = changedTx.internalTransfers.find(internalTx =>
        getInstantStakeType(internalTx, selectedAccountAddress, symbol),
    );

    return internalTransfer ?? null;
};

export const simulateUnstake = async ({
    amount,
    from,
    symbol,
}: StakeTxBaseArgs & { amount: string }) => {
    if (!isSupportedEthStakingNetworkSymbol(symbol)) return null;
    if (!amount || !from || !symbol) return null;

    const ethAddresses = getEthNetworkAddresses(symbol);
    if (!ethAddresses) return null;
    const { addressContractPool } = ethAddresses;

    const amountWei = toWei(amount, 'ether');
    const data = buildUnstakeData(amountWei, UNSTAKE_INTERCHANGES);

    const transactionData = await TrezorConnect.blockchainEvmRpcCall({
        coin: symbol,
        from,
        to: addressContractPool,
        data,
    });

    if (!transactionData.success) {
        throw new Error(transactionData.error.message);
    }

    const unstakeFromPendingValue = decodeFunctionResult({
        abi: EVM_ABI.everstake.unstake,
        functionName: 'unstake',
        data: transactionData.payload.data as `0x${string}`,
    });

    return fromWei(unstakeFromPendingValue.toString(), 'ether');
};

export const getEthereumStakingAddressByType = (
    symbol: NetworkSymbol,
    stakeType: StakeType,
): string => {
    const { addressContractPool, addressContractAccounting } = getEthNetworkAddresses(symbol) ?? {};

    switch (stakeType) {
        case 'stake':
        case 'unstake':
            return addressContractPool || '';
        case 'claim':
            return addressContractAccounting || '';
        default:
            return '';
    }
};
