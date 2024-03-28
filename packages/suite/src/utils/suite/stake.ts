import { PrecomposedLevels, StakeFormState, StakeType } from '@suite-common/wallet-types';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { fromWei, toHex, toWei } from 'web3-utils';
import { getEthereumEstimateFeeParams, sanitizeHex } from '@suite-common/wallet-utils';
import TrezorConnect, { EthereumTransaction } from '@trezor/connect';
import BigNumber from 'bignumber.js';

// Gas reserve ensuring txs are processed
const GAS_RESERVE = 220000;
// source is a required parameter for some functions in the Everstake Wallet SDK.
// This parameter is used for some contract calls.
// It is a constant which allows the SDK to define which app calls its functions.
// Each app which integrates the SDK has its own source, e.g. source for Trezor Suite is '1'.
export const WALLET_SDK_SOURCE = '1';

export const getEthNetworkForWalletSdk = (symbol: NetworkSymbol) => {
    const ethNetworks = {
        thol: 'holesky',
        eth: 'mainnet',
    };

    if (!(symbol in ethNetworks)) return ethNetworks.eth;

    return ethNetworks[symbol as keyof typeof ethNetworks];
};

type StakeTxBaseArgs = {
    from: string;
    symbol: NetworkSymbol;
};

const stake = async ({
    from,
    amount,
    symbol,
}: StakeTxBaseArgs & {
    amount: string;
}) => {
    const MIN_AMOUNT = new BigNumber('100000000000000000');
    const amountWei = toWei(amount, 'ether');

    if (new BigNumber(amountWei).lt(MIN_AMOUNT)) throw new Error(`Min Amount ${MIN_AMOUNT} wei`);

    try {
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        const { contract_pool: contractPool } = Ethereum.selectNetwork(ethNetwork);
        const contractPoolAddress = contractPool.options.address;
        const data = contractPool.methods.stake(WALLET_SDK_SOURCE).encodeABI();

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
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

        const gasConsumption = Number(estimatedFee.payload.levels[0].feeLimit);

        // Create the transaction
        return {
            from,
            to: contractPoolAddress,
            value: amountWei,
            gasLimit: gasConsumption + GAS_RESERVE,
            data,
        };
    } catch (e) {
        throw new Error(e);
    }
};

const unstake = async ({
    from,
    amount,
    interchanges,
    symbol,
}: StakeTxBaseArgs & {
    amount: string;
    interchanges: number;
}) => {
    try {
        const accountInfo = await TrezorConnect.getAccountInfo({
            coin: symbol,
            details: 'tokenBalances',
            descriptor: from,
        });
        if (!accountInfo.success) {
            throw new Error(accountInfo.payload.error);
        }

        const { autocompoundBalance } = accountInfo.payload.stakingPools?.[0] ?? {};
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
        const { contract_pool: contractPool } = Ethereum.selectNetwork(ethNetwork);
        const contractPoolAddress = contractPool.options.address;
        const data = contractPool.methods
            .unstake(amountWei, interchanges, WALLET_SDK_SOURCE)
            .encodeABI();

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
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

        const gasConsumption = Number(estimatedFee.payload.levels[0].feeLimit);

        // Create the transaction
        return {
            from,
            value: '0',
            to: contractPoolAddress,
            gasLimit: gasConsumption + GAS_RESERVE,
            data,
        };
    } catch (error) {
        throw new Error(error);
    }
};

const claimWithdrawRequest = async ({ from, symbol }: StakeTxBaseArgs) => {
    try {
        const accountInfo = await TrezorConnect.getAccountInfo({
            coin: symbol,
            details: 'tokenBalances',
            descriptor: from,
        });
        if (!accountInfo.success) {
            throw new Error(accountInfo.payload.error);
        }

        const { withdrawTotalAmount, claimableAmount } =
            accountInfo.payload.stakingPools?.[0] ?? {};
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
        const { contract_accounting: contractAccounting } = Ethereum.selectNetwork(ethNetwork);
        const contractAccountingAddress = contractAccounting.options.address;
        const data = contractAccounting.methods.claimWithdrawRequest().encodeABI();

        // gasLimit calculation based on address, amount and data size
        // amount is essential for a proper calculation of gasLimit (via blockbook/geth)
        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
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

        const gasConsumption = Number(estimatedFee.payload.levels[0].feeLimit);

        return {
            from,
            to: contractAccountingAddress,
            value: '0',
            gasLimit: gasConsumption + GAS_RESERVE,
            data,
        };
    } catch (error) {
        throw new Error(error);
    }
};

interface GetStakeFormsDefaultValuesParams {
    address: string;
    ethereumStakeType: StakeFormState['ethereumStakeType'];
}

export const getStakeFormsDefaultValues = ({
    address,
    ethereumStakeType,
}: GetStakeFormsDefaultValuesParams) => ({
    fiatInput: '',
    cryptoInput: '',
    outputs: [
        {
            ...DEFAULT_PAYMENT,
            address,
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

const transformTx = (
    tx: any,
    gasPrice: string,
    nonce: string,
    chainId: number,
): EthereumTransaction => {
    const transformedTx = {
        ...tx,
        gasLimit: toHex(tx.gasLimit),
        gasPrice: toHex(toWei(gasPrice, 'gwei')),
        nonce: toHex(nonce),
        chainId,
        data: sanitizeHex(tx.data),
        value: toHex(tx.value),
    };
    delete transformedTx.from;

    return transformedTx;
};

interface PrepareStakeEthTxParams {
    symbol: NetworkSymbol;
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
}: PrepareStakeEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await stake({
            from,
            amount,
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
    interchanges = 0,
}: PrepareUnstakeEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await unstake({
            from,
            amount,
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

interface PrepareClaimEthTxParams extends Omit<PrepareStakeEthTxParams, 'amount'> {}

export const prepareClaimEthTx = async ({
    symbol,
    from,
    gasPrice,
    nonce,
    chainId,
}: PrepareClaimEthTxParams): Promise<PrepareStakeEthTxResponse> => {
    try {
        const tx = await claimWithdrawRequest({ from, symbol });
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

interface GetStakeTxGasLimitParams {
    ethereumStakeType: StakeType | undefined;
    from: string;
    amount: string;
    symbol: NetworkSymbol;
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
        Ethereum.selectNetwork(getEthNetworkForWalletSdk(symbol));

        let txData;
        if (ethereumStakeType === 'stake') {
            txData = await stake({ from, amount, symbol });
        }
        if (ethereumStakeType === 'unstake') {
            // Increase allowedInterchangeNum to enable instant unstaking.
            txData = await unstake({
                from,
                amount,
                interchanges: 0,
                symbol,
            });
        }
        if (ethereumStakeType === 'claim') {
            txData = await claimWithdrawRequest({ from, symbol });
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
