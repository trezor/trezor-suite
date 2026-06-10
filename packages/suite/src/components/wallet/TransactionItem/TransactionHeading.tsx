import { Translation } from '@suite/intl';
import { type PhishingDetectorId } from '@suite-common/token-definitions';
import { getTxHeaderSymbol, isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { Row, TextButton, Tooltip } from '@trezor/components';
import { HELP_CENTER_ZERO_VALUE_ATTACKS } from '@trezor/urls';

import { type WalletAccountTransaction } from 'src/types/wallet';

import { InstantStakeBadge } from './InstantStakeBadge';
import { TransactionHeader } from './TransactionHeader';
import { BlurWrapper } from './TransactionItemBlurWrapper';

const getPhishingTooltipTranslationId = (detectorId?: PhishingDetectorId) => {
    switch (detectorId) {
        case 'FAKE_TOKEN':
            return 'TR_PHISHING_TOOLTIP_FAKE_TOKEN';
        case 'UNKNOWN_TX':
            return 'TR_PHISHING_TOOLTIP_UNKNOWN_TX';
        case 'DUST_AMOUNT':
            return 'TR_PHISHING_TOOLTIP_DUST_AMOUNT';
        case 'ZERO_AMOUNT':
            return 'TR_PHISHING_TOOLTIP_ZERO_AMOUNT';
        case 'TRC10_TRANSFER':
            return 'TR_PHISHING_TOOLTIP_TRC10_TRANSFER';
        default:
            return 'TR_ZERO_PHISHING_TOOLTIP';
    }
};

type TransactionHeadingProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isPhishingTransaction: boolean;
    phishingDetectorId?: PhishingDetectorId;
    dataTestBase: string;
};

export const TransactionHeading = ({
    transaction,
    isPending,
    isPhishingTransaction,
    phishingDetectorId,
    dataTestBase,
}: TransactionHeadingProps) => {
    const symbol = getTxHeaderSymbol(transaction);

    return (
        <Tooltip
            content={
                <Translation
                    id={getPhishingTooltipTranslationId(phishingDetectorId)}
                    values={{
                        a: chunks => (
                            <TextButton
                                intent="neutral"
                                priority="secondary"
                                size="small"
                                href={HELP_CENTER_ZERO_VALUE_ATTACKS}
                            >
                                {chunks}
                            </TextButton>
                        ),
                    }}
                />
            }
            tooltipMaxWidth={320}
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
