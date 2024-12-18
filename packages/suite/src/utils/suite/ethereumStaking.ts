import { Ethereum, ETH_NETWORK_ADDRESSES, EthNetworkAddresses } from '@everstake/wallet-sdk';
import { fromWei, numberToHex, toWei } from 'web3-utils';

import {
    PrecomposedLevels,
    StakeFormState,
    StakeType,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    DEFAULT_PAYMENT,
    STAKE_GAS_LIMIT_RESERVE,
    MIN_ETH_AMOUNT_FOR_STAKING,
    UNSTAKE_INTERCHANGES,
    WALLET_SDK_SOURCE,
    UNSTAKING_ETH_PERIOD,
} from '@suite-common/wallet-constants';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    getEthereumEstimateFeeParams,
    isPending,
    isSupportedEthStakingNetworkSymbol,
    sanitizeHex,
} from '@suite-common/wallet-utils';
import TrezorConnect, { EthereumTransaction, Success, InternalTransfer } from '@trezor/connect';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { ValidatorsQueue } from '@suite-common/wallet-core';
import { BlockchainEstimatedFee } from '@trezor/connect/src/types/api/blockchainEstimateFee';
import { PartialRecord } from '@trezor/type-utils';

const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

type EthNetwork = 'holesky' | 'mainnet';

export const getEthNetworkForWalletSdk = (
    symbol: NetworkSymbol | 'unknown' | undefined,
): EthNetwork => {
    const ethNetworks: PartialRecord<NetworkSymbol, EthNetwork> = {
        thol: 'holesky',
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

export const getAdjustedGasLimitConsumption = (estimatedFee: Success<BlockchainEstimatedFee>) =>
    new BigNumber(estimatedFee.payload.levels[0].feeLimit || '')
        .plus(STAKE_GAS_LIMIT_RESERVE)
        .integerValue(BigNumber.ROUND_DOWN)
        .toNumber();

export type StakeTxBaseArgs = {
    from: string;
    symbol: NetworkSymbol;
    identity?: string;
};

export const stake = async ({
    from,
    amount,
    symbol,
    identity,
}: StakeTxBaseArgs & {
    amount: string;
}) => {
    const amountWei = toWei(amount, 'ether');

    if (new BigNumber(amount).lt(MIN_ETH_AMOUNT_FOR_STAKING)) {
        throw new Error(`Min Amount ${MIN_ETH_AMOUNT_FOR_STAKING} ${symbol.toUpperCase()}`);
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
            throw new Error(estimatedFee.payload.error);
        }

        // Create the transaction
        return {
            from,
            to: contractPoolAddress,
            value: amountWei,
            gasLimit: getAdjustedGasLimitConsumption(estimatedFee),
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
            throw new Error(accountInfo.payload.error);
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
            throw new Error(estimatedFee.payload.error);
        }

        // Create the transaction
        return {
            from,
            value: '0',
            to: contractPoolAddress,
            gasLimit: getAdjustedGasLimitConsumption(estimatedFee),
            data,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export const claimWithdrawRequest = async ({ from, symbol, identity }: StakeTxBaseArgs) => {
    try {
        const accountInfo = await TrezorConnect.getAccountInfo({
            coin: symbol,
            identity,
            details: 'tokenBalances',
            descriptor: from,
        });
        if (!accountInfo.success) {
            throw new Error(accountInfo.payload.error);
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
            throw new Error(estimatedFee.payload.error);
        }

        return {
            from,
            to: contractAccountingAddress,
            value: '0',
            gasLimit: getAdjustedGasLimitConsumption(estimatedFee),
            data,
        };
    } catch (error) {
        throw new Error(error);
    }
};

export interface GetStakeFormsDefaultValuesParams {
    address: string;
    stakeType: StakeFormState['stakeType'];
    amount?: string;
}

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
    ethereumDataHex: '',

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
    gasPrice: string,
    nonce: string,
    chainId: number,
): EthereumTransaction => {
    const transformedTx = {
        ...tx,
        gasLimit: numberToHex(tx.gasLimit),
        gasPrice: numberToHex(toWei(gasPrice, 'gwei')),
        nonce: numberToHex(nonce),
        chainId,
        data: sanitizeHex(tx.data),
        // in send form, the amount is in ether, here in wei because it is converted earlier in stake, unstake, claimToWithdraw methods
        value: numberToHex(tx.value),
    };
    delete transformedTx.from;

    return transformedTx;
};

interface PrepareStakeEthTxParams {
    symbol: NetworkSymbol;
    identity?: string;
    from: string;
    amount: string;
    gasPrice: string;
    nonce: string;
    chainId: number;
}
export type PrepareStakeEthTxResponse =
    | {
          success: true;
          tx: EthereumTransaction;
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
    identity,
}: PrepareStakeEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await stake({
            from,
            amount,
            symbol,
            identity,
        });
        const transformedTx = transformTx(tx, gasPrice, nonce, chainId);

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

interface PrepareUnstakeEthTxParams extends PrepareStakeEthTxParams {
    interchanges: number;
}

export const prepareUnstakeEthTx = async ({
    symbol,
    from,
    amount,
    gasPrice,
    nonce,
    chainId,
    identity,
    interchanges = UNSTAKE_INTERCHANGES,
}: PrepareUnstakeEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await unstake({
            from,
            amount,
            identity,
            interchanges,
            symbol,
        });
        const transformedTx = transformTx(tx, gasPrice, nonce, chainId);

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

type PrepareClaimEthTxParams = Omit<PrepareStakeEthTxParams, 'amount'>;

export const prepareClaimEthTx = async ({
    symbol,
    identity,
    from,
    gasPrice,
    nonce,
    chainId,
}: PrepareClaimEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await claimWithdrawRequest({ from, symbol, identity });
        const transformedTx = transformTx(tx, gasPrice, nonce, chainId);

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

export interface GetStakeTxGasLimitParams {
    stakeType: StakeType | undefined;
    from: string;
    amount: string;
    symbol: NetworkSymbol;
    identity?: string;
}

export type GetStakeTxGasLimitResponse =
    | {
          success: true;
          gasLimit: string;
      }
    | {
          success: false;
          error: PrecomposedLevels;
      };

export const getStakeTxGasLimit = async ({
    stakeType,
    from,
    amount,
    symbol,
    identity,
}: GetStakeTxGasLimitParams): Promise<GetStakeTxGasLimitResponse> => {
    const genericError: PrecomposedLevels = {
        normal: {
            error: 'INCORRECT-FEE-RATE',
            errorMessage: { id: 'TR_GENERIC_ERROR_TITLE' },
            type: 'error',
        },
    };

    if (!stakeType) {
        return {
            success: false,
            error: genericError,
        };
    }

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
    } catch (e) {
        console.error(e);

        return {
            success: false,
            error: genericError,
        };
    }
};

export const getUnstakingPeriodInDays = (validatorWithdrawTimeInSeconds?: number) => {
    if (validatorWithdrawTimeInSeconds === undefined) {
        return UNSTAKING_ETH_PERIOD;
    }

    return secondsToDays(validatorWithdrawTimeInSeconds);
};

export const getDaysToAddToPool = (
    stakeTxs: WalletAccountTransaction[],
    validatorsQueue?: ValidatorsQueue,
) => {
    if (
        validatorsQueue?.validatorAddingDelay === undefined ||
        validatorsQueue?.validatorActivationTime === undefined
    ) {
        return undefined;
    }

    const lastTx = stakeTxs[0];

    if (!lastTx?.blockTime) return 1;

    const now = Math.floor(Date.now() / 1000);
    const secondsToWait =
        lastTx.blockTime +
        validatorsQueue.validatorAddingDelay +
        validatorsQueue.validatorActivationTime -
        now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToUnstake = (
    unstakeTxs: WalletAccountTransaction[],
    validatorsQueue?: ValidatorsQueue,
) => {
    if (validatorsQueue?.validatorWithdrawTime === undefined) {
        return undefined;
    }

    const lastTx = unstakeTxs[0];

    if (!lastTx?.blockTime) return 1;

    const now = Math.floor(Date.now() / 1000);
    const secondsToWait = lastTx.blockTime + validatorsQueue.validatorWithdrawTime - now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToAddToPoolInitial = (validatorsQueue?: ValidatorsQueue) => {
    if (
        validatorsQueue?.validatorAddingDelay === undefined ||
        validatorsQueue?.validatorActivationTime === undefined
    ) {
        return undefined;
    }

    const secondsToWait =
        validatorsQueue.validatorAddingDelay + validatorsQueue.validatorActivationTime;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getInstantStakeType = (
    internalTransfer: InternalTransfer,
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

    const ethereumData = await TrezorConnect.blockchainEvmRpcCall({
        coin: symbol,
        from,
        to: addressContractPool,
        data,
    });

    if (!ethereumData.success) {
        throw new Error(ethereumData.payload.error);
    }

    const approximatedAmount = ethereumData.payload.data;

    return fromWei(approximatedAmount, 'ether');
};
