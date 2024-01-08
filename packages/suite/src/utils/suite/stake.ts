import { StakeFormState } from '@suite-common/wallet-types';
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

interface PrepareStakeEthTxParams {
    symbol: NetworkSymbol;
    from: string;
    amount: string;
    gasPrice: string;
    nonce: string;
    chainId: number;
}
type PrepareStakeEthTxResponse =
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
        // TODO: Implements stake tx type switcher
        const ethNetwork = getEthNetworkForWalletSdk(symbol);
        Ethereum.selectNetwork(ethNetwork);
        const tx = await Ethereum.stake(from, amount, WALLET_SDK_SOURCE);

        tx.gasLimit = toHex(tx.gas);
        tx.gasPrice = toHex(toWei(gasPrice, 'gwei'));
        tx.nonce = toHex(nonce);
        tx.chainId = chainId;
        tx.data = sanitizeHex(tx.data);
        tx.value = toHex(tx.value);
        delete tx.gas;
        delete tx.from;

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
