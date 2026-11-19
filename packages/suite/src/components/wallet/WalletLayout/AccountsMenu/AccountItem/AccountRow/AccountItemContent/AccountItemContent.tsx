import { AccountLabel } from '@suite/account';
import { useTranslation } from '@suite/intl';
import { selectIsDiscreteModeActive } from '@suite-common/discreet-mode';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Icon, Row, TOOLTIP_DELAY_NORMAL, Text, Tooltip } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { CoinBalance } from '#src/components/suite';
import { useSelector } from '#src/hooks/suite';
import { selectIsAccountCustomBackendUnreachable } from '#src/selectors/suite/backendSelectors';
import { selectIsSuiteOnline } from '#src/selectors/suite/suiteSelectors';

import { AccountItemBadges } from './AccountItemBadges';
import { BalancePlaceholder, FiatBalancePlaceholder } from './BalancePlaceholder';
import { BaseCurrency } from './BaseCurrency';

type AccountItemContentProps = {
    customFiatValue?: BaseCurrencyAmount;
    account: Account;
    tokenCount: number;
    hasStaking: boolean;
    dataTestKey: string;
    isFiatLoading: boolean;
    isFocused: boolean;
};

export const AccountItemContent = ({
    customFiatValue,
    account,
    tokenCount,
    hasStaking,
    dataTestKey,
    isFiatLoading,
    isFocused,
}: AccountItemContentProps) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const { translationString } = useTranslation();
    const isFailed = !!account.failed;
    // offline, every backend fails and the custom one is not the problem
    const isCustomBackendUnreachable = useSelector(
        state =>
            selectIsSuiteOnline(state) && selectIsAccountCustomBackendUnreachable(state, account),
    );
    const canShowBalance = account.backendType !== 'coinjoin' || account.status !== 'initial';
    const shouldShowBalancePlaceholder = !isFailed && !canShowBalance;
    const shouldShowCryptoBalance = !isFailed && canShowBalance && tokenCount === 0 && !hasStaking;

    return (
        <Row
            flex="1"
            minWidth={0}
            overflow={discreetMode ? 'visible' : 'hidden'}
            gap={8}
            justifyContent="space-between"
        >
            <Column flex="1" minWidth={0} gap={2} alignItems="flex-start">
                <Text
                    minWidth={0}
                    maxWidth="100%"
                    typographyStyle="body-sm"
                    ellipsisLineCount={1}
                    data-testid={`${dataTestKey}/label`}
                >
                    <AccountLabel account={account} />
                </Text>
                <AccountItemBadges
                    account={account}
                    tokenCount={tokenCount}
                    hasStaking={hasStaking}
                    isFocused={isFocused}
                />
            </Column>
            <Column gap={2} alignItems="flex-end" justifyContent="center" flex="none">
                {isFailed && (
                    <Icon
                        as={WarningIcon}
                        size={16}
                        intent="warning"
                        data-testid="@account-menu/account/error"
                    />
                )}
                {!isFailed && isCustomBackendUnreachable && (
                    <Tooltip
                        content={translationString('TR_CUSTOM_BACKEND_UNREACHABLE')}
                        delayShow={TOOLTIP_DELAY_NORMAL}
                    >
                        <div
                            role="img"
                            aria-label={translationString('TR_CUSTOM_BACKEND_UNREACHABLE')}
                        >
                            <Icon
                                as={WarningIcon}
                                size={16}
                                intent="warning"
                                data-testid="@account-menu/account/backend-error"
                            />
                        </div>
                    </Tooltip>
                )}
                {shouldShowBalancePlaceholder && (
                    <FiatBalancePlaceholder networkSymbol={account.symbol} />
                )}
                {!isFailed && canShowBalance && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="primary">
                        <BaseCurrency
                            isLoading={isFiatLoading}
                            customFiatValue={customFiatValue}
                            symbol={account.symbol}
                            formattedBalance={account.formattedBalance}
                        />
                    </Text>
                )}
                {shouldShowCryptoBalance && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <CoinBalance
                            data-testid="@wallet"
                            value={account.formattedBalance}
                            symbol={account.symbol}
                            showApproximation
                        />
                    </Text>
                )}
                {shouldShowBalancePlaceholder && <BalancePlaceholder />}
            </Column>
        </Row>
    );
};
