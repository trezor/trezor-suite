import {
    ETH_NETWORK_ADDRESSES,
    type EthNetworkAddresses,
    Ethereum,
} from '@everstake/wallet-sdk-ethereum';
import { fromWei, numberToHex, toWei } from 'web3-utils';

import { type EthereumValidatorsQueue } from '@suite-common/wallet-api';
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
import { type BlockchainEstimatedFee } from '@trezor/connect/src/types/api/blockchainEstimateFee';
import { type Ok, type PartialRecord } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    type EthNetwork,
    type GetStakeFormsDefaultValuesParams,
    type GetStakeTxGasLimitParams,
    type PrepareClaimEthTxParams,
    type PrepareStakeEthTxParams,
    type PrepareUnstakeEthTxParams,
    type StakeTxBaseArgs,
} from '../types';

export const getEthNetworkForWalletSdk = (
    symbol: NetworkSymbol | 'unknown' | undefined,
): EthNetwork => {
    const ethNetworks: PartialRecord<NetworkSymbol, EthNetwork> = {
        thod: 'hoodi',
        eth: 'mainnet',
    };
    const network = symbol && symbol !== 'unknown' ? ethNetworks[symbol] : null;

    return network ?? 'mainnet';
};

export const getEthNetworkAddresses = (symbol: NetworkSymbol): EthNetworkAddresses => {
    const defaultAddresses = ETH_NETWORK_ADDRESSES['mainnet'];
    const ethNetwork = getEthNetworkForWalletSdk(symbol);

    if (!ethNetwork) return defaultAddresses;

    return ETH_NETWORK_ADDRESSES[ethNetwork] ?? defaultAddresses;
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
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        const ethereumClient = new Ethereum(ethNetwork);
        const { addressContractPool } = getEthNetworkAddresses(symbol);

        const contractPoolAddress = ethereumClient.contractPool.options.address;
        const data = ethereumClient.contractPool.methods.stake(WALLET_SDK_SOURCE).encodeABI();

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
            to: contractPoolAddress,
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

        const UINT16_MAX = 65535 | 0; // asm type annotation
        // Check for type overflow
        if (interchanges > UINT16_MAX) {
            interchanges = UINT16_MAX;
        }

        const amountWei = toWei(amount, 'ether');
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        const ethereumClient = new Ethereum(ethNetwork);
        const { addressContractPool } = getEthNetworkAddresses(symbol);
        const contractPoolAddress = ethereumClient.contractPool.options.address;
        const data = ethereumClient.contractPool.methods
            .unstake(amountWei, interchanges, WALLET_SDK_SOURCE)
            .encodeABI();

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
            to: contractPoolAddress,
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

        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        const ethereumClient = new Ethereum(ethNetwork);
        const { addressContractAccounting } = getEthNetworkAddresses(symbol);

        const contractAccountingAddress = ethereumClient.contractAccounting.options.address;
        const data = ethereumClient.contractAccounting.methods.claimWithdrawRequest().encodeABI();

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
            to: contractAccountingAddress,
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
    validatorsQueue?: EthereumValidatorsQueue | null,
) => {
    if (
        !validatorsQueue ||
        validatorsQueue?.validatorAddingDelay === undefined ||
        validatorsQueue?.validatorActivationTime === undefined
    ) {
        return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const lastTxBlockTime = stakeTxs[0]?.blockTime || now;

    const secondsToWait =
        lastTxBlockTime +
        validatorsQueue.validatorAddingDelay +
        validatorsQueue.validatorActivationTime -
        now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToUnstake = (
    unstakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthereumValidatorsQueue | null,
) => {
    if (typeof validatorsQueue?.validatorWithdrawTime !== 'number') {
        return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const lastTxBlockTime = unstakeTxs[0]?.blockTime || now;

    const secondsToWait =
        lastTxBlockTime +
        validatorsQueue.validatorWithdrawTime +
        (validatorsQueue?.validatorExitTime || 0) -
        now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToAddToPoolInitial = (validatorsQueue?: EthereumValidatorsQueue | null) => {
    if (
        !validatorsQueue ||
        validatorsQueue?.validatorAddingDelay === undefined ||
        validatorsQueue?.validatorActivationTime === undefined
    ) {
        return DAYS_TO_ADD_TO_POOL_DEFAULT;
    }

    const secondsToWait =
        validatorsQueue.validatorAddingDelay + validatorsQueue.validatorActivationTime;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getInstantStakeType = (
    internalTransfer: Pick<InternalTransfer, 'from' | 'to'>,
    address?: string,
    symbol?: NetworkSymbol,
): StakeType | null => {
    if (!address || !symbol) return null;
    const { from, to } = internalTransfer;
    const { addressContractPool, addressContractWithdrawTreasury } = getEthNetworkAddresses(symbol);

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

    const ethNetwork = getEthNetworkForWalletSdk(symbol);
    const ethereumClient = new Ethereum(ethNetwork);
    const { addressContractPool } = getEthNetworkAddresses(symbol);

    if (!amount || !from || !symbol) return null;

    const amountWei = toWei(amount, 'ether');

    const data = ethereumClient.contractPool.methods
        .unstake(amountWei, UNSTAKE_INTERCHANGES, WALLET_SDK_SOURCE)
        .encodeABI();
    if (!data) return null;

    const transactionData = await TrezorConnect.blockchainEvmRpcCall({
        coin: symbol,
        from,
        to: addressContractPool,
        data,
    });

    if (!transactionData.success) {
        throw new Error(transactionData.error.message);
    }

    const approximatedAmount = transactionData.payload.data;

    return fromWei(approximatedAmount, 'ether');
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
