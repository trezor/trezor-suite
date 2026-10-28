import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { useEarnAccountLabel } from '../../hooks/earn/useEarnAccountLabel';
import { type EarnFormDraftPrefix, type StakingPendingModal } from '../../types';
import { YieldPendingTransactionModal } from '../yield/YieldPendingTransactionModal';

const titleTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnTransactionDataReviewScreen.pendingTitle',
    unstake: 'earn.unstakeTransactionDataReviewScreen.pendingTitle',
    claim: 'earn.claimTransactionDataReviewScreen.pendingTitle',
};

const amountLabelTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnTransactionDataReviewScreen.amountLabel',
    unstake: 'earn.unstakeTransactionDataReviewScreen.amountLabel',
    claim: 'earn.claimTransactionDataReviewScreen.amountLabel',
};

type StakingPendingTransactionModalProps = {
    accountKey: AccountKey;
    pendingModal: StakingPendingModal | null;
    stakeType: EarnFormDraftPrefix;
};

export const StakingPendingTransactionModal = ({
    accountKey,
    pendingModal,
    stakeType,
}: StakingPendingTransactionModalProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useEarnAccountLabel(account);

    if (!account || !pendingModal) {
        return null;
    }

    const { bottomSheetRef, isExploreDisabled, onExplorePress, pendingTransaction } = pendingModal;

    return (
        <YieldPendingTransactionModal
            ref={bottomSheetRef}
            accountLabel={accountLabel}
            accountSymbol={account.symbol}
            amount={
                <ExactCryptoAmountFormatter
                    value={pendingTransaction.amountInBaseUnits}
                    symbol={account.symbol}
                    color="contentPrimary"
                    isBalance={false}
                    isDiscreetText={false}
                />
            }
            amountLabel={<Translation id={amountLabelTranslationId[stakeType]} />}
            fee={pendingTransaction.fee}
            isExploreDisabled={isExploreDisabled}
            onExplorePress={onExplorePress}
            submittedAt={new Date(pendingTransaction.submittedAt)}
            title={<Translation id={titleTranslationId[stakeType]} />}
            txid={pendingTransaction.txid}
        />
    );
};
