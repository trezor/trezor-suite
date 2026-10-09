import { useSelector } from 'react-redux';

import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { TransactionReviewOutputItemRow } from './TransactionReviewOutputItemRow';
import { useTransactionReview } from '../hooks/useTransactionReview';

type TransactionReviewCardanoTokenDetailsProps = {
    value: string;
};

export const TransactionReviewCardanoTokenDetails = ({
    value,
}: TransactionReviewCardanoTokenDetailsProps) => {
    const { accountKey, tokenContract } = useTransactionReview();
    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    if (!tokenInfo) return null;

    return (
        <>
            {!!tokenInfo.fingerprint && (
                <TransactionReviewOutputItemRow translationKey="transactionManagement.review.outputs.cardanoFingerprintLabel">
                    {tokenInfo.fingerprint}
                </TransactionReviewOutputItemRow>
            )}
            {/* Trezor does not know Cardano token decimals and shows the amount in base units.
                This row shows the same raw number so the user can match it on the device. */}
            {tokenInfo.decimals !== 0 && (
                <TransactionReviewOutputItemRow translationKey="transactionManagement.review.outputs.cardanoTrezorAmountLabel">
                    {value}
                </TransactionReviewOutputItemRow>
            )}
        </>
    );
};
