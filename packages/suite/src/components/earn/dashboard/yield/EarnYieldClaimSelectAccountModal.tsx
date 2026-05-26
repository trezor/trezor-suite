import { Address } from '@suite/address';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { CardList, Column, Modal, Row, Text, Tooltip } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useSelector } from 'src/hooks/suite';

import { type YieldAccountRewards, type YieldAccountsRewards } from '../../yield/claim/hooks';

type EarnYieldClaimSelectAccountModalProps = {
    accountsRewards: YieldAccountsRewards;
    onSelect: (account: YieldAccountRewards) => void;
    onClose: () => void;
};

export const EarnYieldClaimSelectAccountModal = ({
    accountsRewards,
    onSelect,
    onClose,
}: EarnYieldClaimSelectAccountModalProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const baseCurrency = useSelector(selectBaseCurrency);

    const handleOnSelect = (account: YieldAccountRewards) => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'claim-select-account-modal',
                to: 'claim-form',
                networkSymbol: account.account.symbol,
            },
        });

        onSelect(account);
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
                {accountsRewards.map(accountRewards => (
                    <CardList.Item
                        key={accountRewards.account.key}
                        onClick={() => handleOnSelect(accountRewards)}
                    >
                        <Row gap={16} flex="1" overflow="hidden">
                            <CoinLogo
                                symbol={accountRewards.account.symbol}
                                size={32}
                                type="token"
                            />
                            <Column flex="1" overflow="hidden" gap={2} alignItems="flex-start">
                                <AccountLabel
                                    account={accountRewards.account}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                    typographyStyle="body-md-strong"
                                />
                                <Address
                                    value={accountRewards.account.descriptor}
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    isTruncated
                                />
                            </Column>
                        </Row>
                        <Tooltip
                            content={
                                isDebugModeActive ? (
                                    <Column gap={8} alignItems="flex-start">
                                        <DebugOnlyBadge />
                                        <Text>
                                            {accountRewards.totalClaimableFiatAmount.toFixed()}{' '}
                                            {baseCurrency.toUpperCase()}
                                        </Text>
                                    </Column>
                                ) : undefined
                            }
                        >
                            <Text typographyStyle="body-md-strong">
                                {BaseCurrencyAmountFormatter.format(
                                    accountRewards.totalClaimableFiatAmount,
                                )}
                            </Text>
                        </Tooltip>
                    </CardList.Item>
                ))}
            </CardList>
        </Modal>
    );
};
