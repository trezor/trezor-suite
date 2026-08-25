import { AccountLabel } from '@suite/account';
import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldAccountsRewards } from '@suite-common/earn-stablecoin-api';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { compareAccountsByCoin } from '@suite-common/wallet-utils';
import { CardList, Column, Icon, Modal, Row, Text, Tooltip } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { TokenIcon, TokenIconSet } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

type EarnYieldClaimSelectAccountModalProps = {
    accountsRewards: YieldAccountsRewards;
    onSelect: (account: YieldAccountsRewards[number]) => void;
    onClose: () => void;
};

const getRewardTokens = ({ rewards }: YieldAccountsRewards[number]) => [
    ...new Map(
        rewards.map(({ token }) => [
            token.address.toLowerCase(),
            { symbol: token.symbol, contract: token.address },
        ]),
    ).values(),
];

export const EarnYieldClaimSelectAccountModal = ({
    accountsRewards,
    onSelect,
    onClose,
}: EarnYieldClaimSelectAccountModalProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const baseCurrency = useSelector(selectBaseCurrency);

    const sortedAccountsRewards = [...accountsRewards].sort((a, b) =>
        compareAccountsByCoin(a.account, b.account),
    );

    const handleOnSelect = (account: YieldAccountsRewards[number]) => {
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
                {sortedAccountsRewards.map(accountRewards => {
                    const rewardTokens = getRewardTokens(accountRewards);

                    return (
                        <CardList.Item
                            key={accountRewards.account.key}
                            onClick={() => handleOnSelect(accountRewards)}
                        >
                            <Row gap={16} flex="1" overflow="hidden">
                                <TokenIcon symbol={accountRewards.account.symbol} size={32} />
                                <Column flex="1" overflow="hidden" gap={2} alignItems="flex-start">
                                    <AccountLabel
                                        account={accountRewards.account}
                                        showAccountTypeBadge
                                        accountTypeBadgeSize="small"
                                        typographyStyle="body-md-strong"
                                    />
                                    <Row gap={6} width="100%" overflow="hidden">
                                        <TokenIconSet
                                            symbol={accountRewards.account.symbol}
                                            tokens={rewardTokens}
                                            size={16}
                                            gap={12}
                                        />
                                        <Text
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                            maxWidth="100%"
                                            ellipsisLineCount={1}
                                        >
                                            {rewardTokens.map(({ symbol }) => symbol).join(', ')}
                                        </Text>
                                    </Row>
                                </Column>
                            </Row>
                            <Row gap={8} alignItems="center" flex="none">
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
                                    <HiddenPlaceholder>
                                        <Text typographyStyle="body-md-strong">
                                            {BaseCurrencyAmountFormatter.format(
                                                accountRewards.totalClaimableFiatAmount,
                                            )}
                                        </Text>
                                    </HiddenPlaceholder>
                                </Tooltip>
                                <Icon
                                    as={CaretRightIcon}
                                    size={16}
                                    intent="neutral"
                                    priority="secondary"
                                />
                            </Row>
                        </CardList.Item>
                    );
                })}
            </CardList>
        </Modal>
    );
};
