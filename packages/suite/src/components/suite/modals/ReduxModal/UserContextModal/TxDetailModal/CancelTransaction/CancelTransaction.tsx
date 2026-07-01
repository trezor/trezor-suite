import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import {
    type SelectedAccountLoaded,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    Card,
    Column,
    Divider,
    InfoItem,
    Row,
    Skeleton,
    Text,
    TextButton,
} from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { HELP_CENTER_CANCEL_TRANSACTION } from '@trezor/urls';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';
import { useCancelTxContext } from 'src/hooks/wallet/useCancelTxContext';

import { useCancelTransactionData } from './useCancelTransactionData';

type CancelTransactionProps = {
    tx: WalletAccountTransaction;
    selectedAccount: SelectedAccountLoaded;
};

const CancelTransactionSkeletonRow = ({ animate }: { animate: boolean }) => (
    <InfoItem
        direction="row"
        label={<Skeleton width={90} animate={animate} />}
        typographyStyle="body-md"
        intent="neutral"
        priority="primary"
    >
        <Column alignItems="flex-end" gap={8}>
            <Skeleton width={80} animate={animate} />
            <Skeleton width={50} height={14} animate={animate} />
        </Column>
    </InfoItem>
);

const CancelTransactionCard = ({ children }: { children: ReactNode }) => (
    <Card
        type="contrast"
        paddingType="small"
        header={
            <Row justifyContent="space-between">
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_CANCEL_TX_HEADER" />
                </Text>
                <TextButton href={HELP_CENTER_CANCEL_TRANSACTION} isUnderlined size="small">
                    <Translation id="TR_LEARN_MORE" />
                </TextButton>
            </Row>
        }
    >
        <Column gap={16}>{children}</Column>
    </Card>
);

export const CancelTransaction = ({ tx, selectedAccount }: CancelTransactionProps) => {
    const { isComposing } = useCancelTxContext();
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const data = useCancelTransactionData({ tx, selectedAccount });

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
