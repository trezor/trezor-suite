import { PrecomposedLevels, StakeFormState, StakeType } from '@suite-common/wallet-types';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { toHex, toWei } from 'web3-utils';
import { sanitizeHex } from '@suite-common/wallet-utils';
import { EthereumTransaction } from '@trezor/connect';
import { WALLET_SDK_SOURCE } from 'src/constants/suite/ethStaking';

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
});

export const getEthNetworkForWalletSdk = (symbol: NetworkSymbol) => {
    const ethNetworks = {
        thol: 'holesky',
        tgor: 'goerli',
        eth: 'mainnet',
    };

    if (!(symbol in ethNetworks)) return ethNetworks.eth;

    return ethNetworks[symbol as keyof typeof ethNetworks];
};

const transformTx = (tx: any, gasPrice: string, nonce: string, chainId: number) => {
    tx.gasLimit = toHex(tx.gasLimit);
    tx.gasPrice = toHex(toWei(gasPrice, 'gwei'));
    tx.nonce = toHex(nonce);
    tx.chainId = chainId;
    tx.data = sanitizeHex(tx.data);
    tx.value = toHex(tx.value);
    delete tx.from;
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
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        Ethereum.selectNetwork(ethNetwork);
        const tx = await Ethereum.stake(from, amount, WALLET_SDK_SOURCE);
        transformTx(tx, gasPrice, nonce, chainId);

        return {
            success: true,
            tx,
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
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        Ethereum.selectNetwork(ethNetwork);
        const tx = await Ethereum.unstake(from, amount, interchanges, WALLET_SDK_SOURCE);
        transformTx(tx, gasPrice, nonce, chainId);

        return {
            success: true,
            tx,
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
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        Ethereum.selectNetwork(ethNetwork);
        const tx = await Ethereum.claimWithdrawRequest(from);

        transformTx(tx, gasPrice, nonce, chainId);

        return {
            success: true,
            tx,
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
            txData = await Ethereum.stake(from, amount, WALLET_SDK_SOURCE);
        }
        if (ethereumStakeType === 'unstake') {
            // Increase allowedInterchangeNum to enable instant unstaking.
            txData = await Ethereum.unstake(from, amount, 0, WALLET_SDK_SOURCE);
        }
        if (ethereumStakeType === 'claim') {
            txData = await Ethereum.claimWithdrawRequest(from);
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
