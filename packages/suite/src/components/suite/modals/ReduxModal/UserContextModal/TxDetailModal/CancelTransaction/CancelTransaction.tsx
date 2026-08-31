import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useSelector } from '@suite-common/redux-utils';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Column, Divider, InfoItem, Row, Skeleton, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useCancelTxContext } from 'src/hooks/wallet/useCancelTxContext';

import { CancelTransactionCard } from './CancelTransactionCard';
import { CancelTransactionSkeletonRow } from './CancelTransactionSkeletonRow';
import { useCancelTransactionData } from './useCancelTransactionData';

type CancelTransactionProps = {
    tx: WalletAccountTransaction;
    account: Account;
};

export const CancelTransaction = ({ tx, account }: CancelTransactionProps) => {
    const { isComposing } = useCancelTxContext();
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const data = useCancelTransactionData({ tx, account });

    if (!data) {
        if (!isComposing) return null;

        return (
            <CancelTransactionCard>
                <Skeleton width="100%" height={14} animate={shouldAnimate} />
                <CancelTransactionSkeletonRow animate={shouldAnimate} />
                <Divider margin={{ vertical: 8 }} />
                <CancelTransactionSkeletonRow animate={shouldAnimate} />
            </CancelTransactionCard>
        );
    }

    const { noticeId, topRow, bottomRow, networkType, symbol } = data;

    const renderRow = ({ labelId, amount, feeRate }: (typeof data)['topRow']) => (
        <InfoItem
            direction="row"
            label={<Translation id={labelId} />}
            typographyStyle="body-md"
            intent="neutral"
            priority="primary"
        >
            <Column alignItems="flex-end">
                <Row gap={12} alignItems="baseline">
                    {feeRate !== undefined && (
                        <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                            <FeeRate feeRate={feeRate} networkType={networkType} />
                        </Text>
                    )}
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={amount}
                        symbol={symbol}
                    />
                </Row>
                <Text intent="neutral" priority="secondary" typographyStyle="body-xs">
                    <BaseCurrencyValue disableHiddenPlaceholder amount={amount} symbol={symbol} />
                </Text>
            </Column>
        </InfoItem>
    );

    return (
        <CancelTransactionCard>
            <Text typographyStyle="body-sm">
                <Translation id={noticeId} />
            </Text>
            {renderRow(topRow)}
            <Divider margin={{ vertical: 8 }} />
            {renderRow(bottomRow)}
        </CancelTransactionCard>
    );
};
