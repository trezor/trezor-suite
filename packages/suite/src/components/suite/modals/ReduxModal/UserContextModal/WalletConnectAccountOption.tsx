import { memo } from 'react';

import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { selectAccountTokens, selectBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, isUtxoBased } from '@suite-common/wallet-utils';
import { Badge, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { CoinBalance, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';

type WalletConnectAccountOptionProps = {
    account: Account;
};

const WalletConnectAccountOptionComponent = ({ account }: WalletConnectAccountOptionProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const tokens = useSelector(state => selectAccountTokens(state, account.key));
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const { fiatAmount } = useFiatFromCryptoValue({
        amount: account.formattedBalance,
        symbol: account.symbol,
    });

    const tokenCount = tokens?.shownWithBalance.length ?? 0;

    return (
        <Row gap={16} justifyContent="space-between" width="100%">
            <Row gap={12} flex="1" minWidth={0} overflow="hidden">
                <TokenIcon symbol={account.symbol} size={24} />
                <Column alignItems="flex-start" minWidth={0} overflow="hidden" width="100%">
                    <Row gap={8} minWidth={0} width="100%">
                        <AccountLabel
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                            rowProps={{ flex: '1', minWidth: 0 }}
                        />
                        {tokenCount > 0 && (
                            <Badge size="small">
                                <Translation
                                    id="TR_ACCOUNT_TOKENS_COUNT"
                                    values={{ count: tokenCount }}
                                />
                            </Badge>
                        )}
                    </Row>
                    {/* the descriptor of a UTXO account is an xpub, not an address */}
                    {!isUtxoBased(account) && (
                        <Address
                            value={account.descriptor}
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-sm"
                            isTruncated
                        />
                    )}
                </Column>
            </Row>
            <Column alignItems="flex-end" flex="none">
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
        </Row>
    );
};

// formatOptionLabel runs for every option on every menu render
export const WalletConnectAccountOption = memo(WalletConnectAccountOptionComponent);
