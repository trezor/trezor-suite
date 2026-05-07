import { Translation } from '@suite/intl';
import { getTxHeaderSymbol, isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { Link, Row, Tooltip } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';

import { type WalletAccountTransaction } from 'src/types/wallet';

import { InstantStakeBadge } from './InstantStakeBadge';
import { TransactionHeader } from './TransactionHeader';
import { BlurWrapper } from './TransactionItemBlurWrapper';

type TransactionHeadingProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isPhishingTransaction: boolean;
    dataTestBase: string;
};

export const TransactionHeading = ({
    transaction,
    isPending,
    isPhishingTransaction,
    dataTestBase,
}: TransactionHeadingProps) => {
    const symbol = getTxHeaderSymbol(transaction);

    return (
        <Tooltip
            content={
                <Translation
                    id="TR_ZERO_PHISHING_TOOLTIP"
                    values={{
                        a: chunks => <Link href={HELP_CENTER_ZERO_VALUE_ATTACKS}>{chunks}</Link>,
                    }}
                />
            }
            tooltipMaxWidth={300}
            isActive={isPhishingTransaction}
            hasIcon
        >
            <BlurWrapper $isBlurred={isPhishingTransaction}>
                <Row gap={4} data-testid={`${dataTestBase}/heading`}>
                    <TransactionHeader transaction={transaction} isPending={isPending} />
                    {isSupportedEthStakingNetworkSymbol(transaction.symbol) && (
                        <InstantStakeBadge transaction={transaction} symbol={symbol} />
                    )}
                </Row>
            </BlurWrapper>
        </Tooltip>
    );
};
