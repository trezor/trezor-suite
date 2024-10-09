import {
    PrecomposedLevels,
    StakeFormState,
    StakeType,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetwork } from '@everstake/wallet-sdk/ethereum';
import { fromWei, hexToNumberString, numberToHex, toWei } from 'web3-utils';
import { getEthereumEstimateFeeParams, isPending, sanitizeHex } from '@suite-common/wallet-utils';
import TrezorConnect, { EthereumTransaction, Success, InternalTransfer } from '@trezor/connect';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { STAKE_GAS_LIMIT_RESERVE, ValidatorsQueue } from '@suite-common/wallet-core';
import { BlockchainEstimatedFee } from '@trezor/connect/src/types/api/blockchainEstimateFee';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MAX_ETH_AMOUNT_FOR_STAKING,
} from 'src/constants/suite/ethStaking';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';

// source is a required parameter for some functions in the Everstake Wallet SDK.
// This parameter is used for some contract calls.
// It is a constant which allows the SDK to define which app calls its functions.
// Each app which integrates the SDK has its own source, e.g. source for Trezor Suite is '1'.
export const WALLET_SDK_SOURCE = '1';

// Used when Everstake unstaking period is not available from the API.
export const UNSTAKING_ETH_PERIOD = 3;

const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

type EthNetwork = 'holesky' | 'mainnet';

export const getEthNetworkForWalletSdk = (symbol: NetworkSymbol): EthNetwork => {
    const ethNetworks: { [key in NetworkSymbol]?: EthNetwork } = {
        thol: 'holesky',
        eth: 'mainnet',
    };

    return ethNetworks[symbol] || ethNetworks.eth!;
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
        const { contract_pool: contractPool } = selectNetwork(ethNetwork);
        const contractPoolAddress = contractPool.options.address;
        const data = contractPool.methods.stake(WALLET_SDK_SOURCE).encodeABI();

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
            identity,
            request: {
                blocks: [2],
                specific: {
                    from,
                    ...getEthereumEstimateFeeParams(contractPoolAddress, amount, undefined, data),
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
        const { contract_pool: contractPool } = selectNetwork(ethNetwork);
        const contractPoolAddress = contractPool.options.address;
        const data = contractPool.methods
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
                    ...getEthereumEstimateFeeParams(contractPoolAddress, '0', undefined, data),
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
        const { contract_accounting: contractAccounting } = selectNetwork(ethNetwork);
        const contractAccountingAddress = contractAccounting.options.address;
        const data = contractAccounting.methods.claimWithdrawRequest().encodeABI();

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
                        contractAccountingAddress,
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
    ethereumStakeType: StakeFormState['ethereumStakeType'];
    amount?: string;
}

export const getStakeFormsDefaultValues = ({
    address,
    ethereumStakeType,
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

    ethereumStakeType,
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
    interchanges = 0,
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
    ethereumStakeType: StakeType | undefined;
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
    ethereumStakeType,
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

    if (!ethereumStakeType) {
        return {
            success: false,
            error: genericError,
        };
    }

    try {
        let txData;
        if (ethereumStakeType === 'stake') {
            txData = await stake({ from, amount, symbol, identity });
        }
        if (ethereumStakeType === 'unstake') {
            // Increase allowedInterchangeNum to enable instant unstaking.
            txData = await unstake({
                from,
                amount,
                interchanges: 0,
                symbol,
                identity,
            });
        }
        if (ethereumStakeType === 'claim') {
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

export const getUnstakingAmount = (ethereumData: string | undefined): string | null => {
    if (!ethereumData) return null;

    // Check if the first two characters are '0x' and remove them if they are
    const data = ethereumData.startsWith('0x') ? ethereumData.slice(2) : ethereumData;
    const dataBuffer = Buffer.from(data, 'hex');

    return hexToNumberString(`0x${dataBuffer.subarray(4, 36).toString('hex')}`);
};

export const getInstantStakeType = (
    internalTransfer: InternalTransfer,
    address?: string,
    symbol?: NetworkSymbol,
): StakeType | null => {
    if (!address || !symbol) return null;
    const { from, to } = internalTransfer;
    const ethNetwork = getEthNetworkForWalletSdk(symbol);
    const { address_pool: poolAddress, address_withdraw_treasury: withdrawTreasuryAddress } =
        selectNetwork(ethNetwork);

    if (from === poolAddress && to === withdrawTreasuryAddress) {
        return 'stake';
    }

    if (from === poolAddress && to === address) {
        return 'unstake';
    }

    if (from === withdrawTreasuryAddress && to === address) {
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

export const calculateGains = (input: string, apy: number, divisor: number) => {
    const amount = new BigNumber(input).multipliedBy(apy).dividedBy(100).dividedBy(divisor);

    return amount.toFixed(5, 1);
};

interface ValidateMaxOptions {
    except?: boolean;
}

export const validateStakingMax =
    (translationString: TranslationFunction, options?: ValidateMaxOptions) => (value: string) => {
        if (!options?.except && value && BigNumber(value).gt(MAX_ETH_AMOUNT_FOR_STAKING)) {
            return translationString('AMOUNT_EXCEEDS_MAX', {
                maxAmount: MAX_ETH_AMOUNT_FOR_STAKING.toString(),
            });
        }
    };
export const simulateUnstake = async ({
    amount,
    from,
    symbol,
}: StakeTxBaseArgs & { amount: string }) => {
    const ethNetwork = getEthNetworkForWalletSdk(symbol);
    const { address_pool: poolAddress, contract_pool: contractPool } = selectNetwork(ethNetwork);

    if (!amount || !from || !symbol) return null;

    const amountWei = toWei(amount, 'ether');
    const interchanges = 0;

    const data = contractPool.methods
        .unstake(amountWei, interchanges, WALLET_SDK_SOURCE)
        .encodeABI();
    if (!data) return null;

    const ethereumData = await TrezorConnect.blockchainEvmRpcCall({
        coin: symbol,
        from,
        to: poolAddress,
        data,
    });

    if (!ethereumData.success) {
        throw new Error(ethereumData.payload.error);
    }

    const approximatedAmount = ethereumData.payload.data;

    return fromWei(approximatedAmount, 'ether');
};
