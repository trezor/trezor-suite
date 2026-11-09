import { AccountLabel } from '@suite/account';
import { Translation } from '@suite/intl';
import { selectIsDiscreteModeActive } from '@suite-common/discreet-mode';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountTypeName } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { AccountItemBadge } from './AccountItemBadge';
import { AccountItemBottomLine } from './AccountItemBottomLine';
import { FiatBalancePlaceholder } from './BalancePlaceholder';
import { BaseCurrency } from './BaseCurrency';

type AccountItemContentProps = {
    customFiatValue?: BaseCurrencyAmount;
    account: Account;
    tokenCount: number;
    hasStaking: boolean;
    dataTestKey: string;
    isFiatLoading: boolean;
};

export const AccountItemContent = ({
    customFiatValue,
    account,
    tokenCount,
    hasStaking,
    dataTestKey,
    isFiatLoading,
}: AccountItemContentProps) => {
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const accountTypeName = account.accountType === 'normal' ? null : getAccountTypeName(account);
    const isFailed = !!account.failed;
    const canShowBalance = account.backendType !== 'coinjoin' || account.status !== 'initial';
    const shouldShowBalancePlaceholder = !isFailed && !canShowBalance;

    return (
        <Row
            flex="1"
            minWidth={0}
            overflow={discreetMode ? 'visible' : 'hidden'}
            gap={8}
            justifyContent="space-between"
        >
            <Column
                flex="1"
                minWidth={0}
                gap={2}
                alignItems="flex-start"
                alignSelf={accountTypeName ? 'flex-start' : 'center'}
            >
                <Text
                    minWidth={0}
                    maxWidth="100%"
                    typographyStyle="body-sm"
                    ellipsisLineCount={1}
                    data-testid={`${dataTestKey}/label`}
                >
                    <AccountLabel account={account} />
                </Text>
                {accountTypeName && (
                    <AccountItemBadge>
                        <Translation id={accountTypeName} />
                    </AccountItemBadge>
                )}
            </Column>
            <Column gap={2} alignItems="flex-end" flex="none">
                {isFailed && (
                    <Icon
                        as={WarningIcon}
                        size={16}
                        intent="warning"
                        data-testid="@account-menu/account/error"
                    />
                )}
                {shouldShowBalancePlaceholder && (
                    <FiatBalancePlaceholder networkSymbol={account.symbol} />
                )}
                {!isFailed && canShowBalance && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <BaseCurrency
                            isLoading={isFiatLoading}
                            customFiatValue={customFiatValue}
                            symbol={account.symbol}
                            formattedBalance={account.formattedBalance}
                        />
                    </Text>
                )}
                <AccountItemBottomLine
                    account={account}
                    tokenCount={tokenCount}
                    hasStaking={hasStaking}
                    shouldShowCryptoBalance={
                        !isFailed && canShowBalance && tokenCount === 0 && !hasStaking
                    }
                    shouldShowBalancePlaceholder={shouldShowBalancePlaceholder}
                />
            </Column>
        </Row>
    );
};
