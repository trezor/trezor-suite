import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { useFormatters } from '@suite-common/formatters';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, getAccountFiatBalance } from '@suite-common/wallet-utils';
import { CardList, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { HiddenPlaceholder } from 'src/components/suite';
import { ItemClickableContainer } from 'src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';
import { useSelector } from 'src/hooks/suite';

type GlobalReceiveAccountListItemProps = {
    account: Account;
    dataTestId: string;
    iconSize?: 24 | 40;
    onClick: (account: Account) => void;
    variant?: 'card' | 'plain';
};

export const GlobalReceiveAccountListItem = ({
    account,
    dataTestId,
    iconSize = 40,
    onClick,
    variant = 'card',
}: GlobalReceiveAccountListItemProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const fiatAmount = getAccountFiatBalance({
        account,
        baseCurrencyCode,
        rates,
        shouldIncludeTokens: true,
        shouldIncludeStaking: true,
    });
    const { address } = getUnusedAddressFromAccount(account);

    const content = (
        <>
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden" flex="1">
                <TokenIcon symbol={account.symbol} size={iconSize} />
                <Column overflow="hidden" alignItems="flex-start">
                    <Text typographyStyle="body-md" as="div" maxWidth="100%">
                        <AccountLabel
                            account={account}
                            accountTypeBadgeSize="medium"
                            showAccountTypeBadge
                        />
                    </Text>
                    {address !== undefined && (
                        <Address
                            value={address}
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-sm"
                            isTruncated
                        />
                    )}
                </Column>
            </Row>
            <Text typographyStyle="body-md">
                <HiddenPlaceholder>
                    <BaseCurrencyAmountFormatter
                        value={fiatAmount ?? BASE_CURRENCY_ZERO}
                        currency={baseCurrencyCode}
                    />
                </HiddenPlaceholder>
            </Text>
        </>
    );

    if (variant === 'plain') {
        return (
            <ItemClickableContainer onClick={() => onClick(account)}>
                {content}
            </ItemClickableContainer>
        );
    }

    return <CardList.Item onClick={() => onClick(account)}>{content}</CardList.Item>;
};
