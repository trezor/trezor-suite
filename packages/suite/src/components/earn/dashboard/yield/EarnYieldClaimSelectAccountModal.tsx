import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { CardList, Column, Modal, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { Address } from 'src/components/suite/Address';
import { useAnalytics } from 'src/support/useAnalytics';

export type EarnYieldClaimableAccount = {
    account: Account;
    totalFiatAmount: BaseCurrencyAmount | null;
};

type EarnYieldClaimSelectAccountModalProps = {
    claimableAccounts: EarnYieldClaimableAccount[];
    onSelect: (claimableAccount: EarnYieldClaimableAccount) => void;
    onClose: () => void;
};

export const EarnYieldClaimSelectAccountModal = ({
    claimableAccounts,
    onSelect,
    onClose,
}: EarnYieldClaimSelectAccountModalProps) => {
    const analytics = useAnalytics();
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const handleOnSelect = (claimableAccount: EarnYieldClaimableAccount) => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'claim-select-account-modal',
                to: 'claim-form',
                networkSymbol: claimableAccount.account.symbol,
            },
        });

        onSelect(claimableAccount);
    };

    const handleOnCancel = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'claim-select-account-modal',
                to: 'claim-select-account-modal',
            },
        });

        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_EARN_YIELD_CLAIM_MODAL_TITLE" />}
            description={<Translation id="TR_EARN_YIELD_CLAIM_MODAL_SUBTITLE" />}
            onCancel={handleOnCancel}
        >
            <CardList>
                {claimableAccounts.map(claimable => (
                    <CardList.Item
                        key={claimable.account.key}
                        onClick={() => handleOnSelect(claimable)}
                    >
                        <Row gap={16} flex="1" overflow="hidden">
                            <CoinLogo symbol={claimable.account.symbol} size={32} type="token" />
                            <Column flex="1" overflow="hidden" gap={2} alignItems="flex-start">
                                <AccountLabel
                                    account={claimable.account}
                                    typographyStyle="body-md-strong"
                                />
                                <Address
                                    value={claimable.account.descriptor}
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    isTruncated
                                />
                            </Column>
                        </Row>
                        <Text typographyStyle="body-md-strong">
                            {claimable.totalFiatAmount !== null
                                ? BaseCurrencyAmountFormatter.format(claimable.totalFiatAmount)
                                : '—'}
                        </Text>
                    </CardList.Item>
                ))}
            </CardList>
        </Modal>
    );
};
