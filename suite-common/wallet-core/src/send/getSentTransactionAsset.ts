import { type SentTransactionAsset } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { asAmountSubunit, formatNetworkAmount, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type GetSentTransactionAssetParams = {
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
    precomposedForm: FormState | undefined;
    symbol: NetworkSymbol;
};

/** What the sent toast names: the NFT item, the token amount, or the total without the fee. */
export const getSentTransactionAsset = ({
    precomposedTransaction,
    precomposedForm,
    symbol,
}: GetSentTransactionAssetParams): SentTransactionAsset => {
    const { token, totalSpent, fee } = precomposedTransaction;
    const nftTokenId = precomposedForm?.outputs[0]?.nftTokenId;

    if (token && nftTokenId !== undefined) {
        return { token, nftTokenId };
    }

    if (token) {
        const amount = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(totalSpent)),
            decimals: token.decimals,
        }).toString();

        return { token, amount };
    }

    const spentWithoutFee = new BigNumber(totalSpent).minus(fee).toString();

    return { amount: formatNetworkAmount(spentWithoutFee, symbol) };
};
