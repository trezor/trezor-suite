import { Address } from '@suite/address';
import { useFormatters } from '@suite-common/formatters';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, isUtxoBased } from '@suite-common/wallet-utils';
import { CardList, Column, Icon, Row, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { CoinBalance, HiddenPlaceholder } from 'src/components/suite';
import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';

interface ReceiveAccountItemProps {
    account: Account;
    onAccountSelect: (account: Account) => void;
}

export const ReceiveAccountItem = ({ account, onAccountSelect }: ReceiveAccountItemProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: account.formattedBalance,
        symbol: account.symbol,
    });

    const isUtxoBasedNetwork = isUtxoBased(account);
    const { address } = getUnusedAddressFromAccount(account);

    if (!address) return null;

    return (
        <CardList.Item onClick={() => onAccountSelect(account)}>
            <Row gap={12}>
                <TokenIcon size={24} symbol={account.symbol} />

                <Column>
                    <Text maxWidth={200} as="div">
                        <AccountLabeling
                            account={account}
                            accountTypeBadgeSize="small"
                            showAccountTypeBadge
                        />
                    </Text>

                    {!isUtxoBasedNetwork && (
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

            <Row gap={12} alignItems="center">
                <Column alignItems="flex-end">
                    <CoinBalance value={account.formattedBalance} symbol={account.symbol} />

                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <HiddenPlaceholder>
                            <BaseCurrencyAmountFormatter
                                value={fiatAmount ?? BASE_CURRENCY_ZERO}
                                currency={baseCurrency}
                            />
                        </HiddenPlaceholder>
                    </Text>
                </Column>

                {isUtxoBasedNetwork && (
                    <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
                )}
            </Row>
        </CardList.Item>
    );
};
