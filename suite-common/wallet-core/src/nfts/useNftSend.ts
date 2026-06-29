import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@suite-common/react-query';

import { selectSelectedDevice } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getAccountIdentity, prepareEthereumTransaction } from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/connect';
import TrezorConnect from '@trezor/connect';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { selectAddressDisplayType } from '../settings/walletSettingsReducer';
import { ethereumGetCurrentNonceThunk } from '../send/sendFormEthereumThunks';
import { synchronizeSentTransactionThunk } from '../send/sendFormThunks';

export type NftSendParams = {
    recipient: string;
    amount: number;
    composedTransaction: PrecomposedTransactionFinal;
};

type UseNftSendParams = {
    account: Account;
    token: TokenInfo;
    tokenId: string;
};

export const useNftSend = ({ account, token, tokenId }: UseNftSendParams) => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    return useMutation({
        mutationFn: async ({ recipient, amount, composedTransaction }: NftSendParams) => {
            const network = getNetwork(account.symbol);

            if (account.networkType !== 'ethereum' || !network.chainId) {
                throw new Error('NFT send is only supported on EVM networks.');
            }

            if (!device) {
                throw new Error('No device connected.');
            }

            const { nonce } = await dispatch(
                ethereumGetCurrentNonceThunk({ selectedAccount: account }),
            ).unwrap();

            const transaction = prepareEthereumTransaction({
                token,
                chainId: network.chainId,
                to: recipient,
                amount: String(amount),
                gasLimit: composedTransaction.feeLimit ?? '',
                maxFeePerGas: composedTransaction.maxFeePerGas,
                maxPriorityFeePerGas: composedTransaction.maxPriorityFeePerGas,
                gasPrice: composedTransaction.feePerByte,
                nonce,
                from: account.descriptor,
                tokenId,
            });

            const signResponse = await TrezorConnect.ethereumSignTransaction({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                path: account.path,
                transaction,
                chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            });

            if (!signResponse.success) {
                throw new Error(signResponse.error);
            }

            const { serializedTx } = signResponse.payload;

            const pushResponse = await TrezorConnect.pushTransaction({
                tx: serializedTx,
                coin: account.symbol,
                identity: getAccountIdentity(account),
            });

            if (!pushResponse.success) {
                throw new Error(pushResponse.error);
            }

            const txid = pushResponse.payload.txid;

            dispatch(
                synchronizeSentTransactionThunk({
                    selectedAccount: account,
                    precomposedTransaction: composedTransaction,
                    txid,
                }),
            );

            return { txid };
        },
    });
};
