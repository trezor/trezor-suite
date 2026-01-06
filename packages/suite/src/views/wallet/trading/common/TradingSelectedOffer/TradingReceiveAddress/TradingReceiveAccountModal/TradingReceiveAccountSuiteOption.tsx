import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, isUtxoBased } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings, typography } from '@trezor/theme';

import { AccountLabeling, Address, CoinBalance, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { TradingVerifyFormAccountOptionProps } from 'src/types/trading/tradingVerify';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingReceiveAccountOptionRow } from './TradingReceiveAccountOptionRow';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

const AccountName = styled.div`
    display: flex;
    ${typography.body}
`;

interface TradingReceiveAccountSuiteOptionProps {
    account: Account;
    option: TradingVerifyFormAccountOptionProps;
}

export const TradingReceiveAccountSuiteOption = ({
    account,
    option,
}: TradingReceiveAccountSuiteOptionProps) => {
    const { tradingReceiveAddress, extraFieldDescription } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const baseCurrency = useSelector(selectBaseCurrency);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: account.formattedBalance,
        symbol: account.symbol,
    });

    const isUtxoBasedNetwork = isUtxoBased(account);
    const requiresExtraField = !!extraFieldDescription;

    const { address } = getUnusedAddressFromAccount(account);

    if (!address) return null;

    const onOptionClick = () => {
        tradingReceiveAddress.onChangeAccount(option);
        modalControls.close();

        if (isUtxoBasedNetwork) {
            modalControls.open('utxoAddressModal');
        }

        if (requiresExtraField) {
            modalControls.open('extraFieldModal');
        }
    };

    return (
        <TradingReceiveAccountOptionRow
            data-testid="@trading/receive-account-modal/option/suite"
            justifyContent="space-between"
            onClick={onOptionClick}
        >
            <Row gap={spacings.sm}>
                <CoinLogo size={24} symbol={account.symbol} />

                <Column>
                    <AccountName>
                        <AccountLabeling
                            account={account}
                            accountTypeBadgeSize="small"
                            showAccountTypeBadge
                        />
                    </AccountName>
                    {!isUtxoBasedNetwork && (
                        <Address
                            value={address ?? null}
                            variant="tertiary"
                            typographyStyle="hint"
                            isTruncated
                        />
                    )}
                </Column>
            </Row>

            <Row gap={spacings.sm} alignItems="center">
                <Column alignItems="flex-end">
                    <CoinBalance value={account.formattedBalance} symbol={account.symbol} />

                    <Text typographyStyle="hint" variant="tertiary">
                        <HiddenPlaceholder>
                            <BaseCurrencyAmountFormatter
                                value={fiatAmount ?? BASE_CURRENCY_ZERO}
                                currency={baseCurrency}
                            />
                        </HiddenPlaceholder>
                    </Text>
                </Column>

                {(isUtxoBasedNetwork || requiresExtraField) && (
                    <Icon name="caretRight" size={20} variant="tertiary" />
                )}
            </Row>
        </TradingReceiveAccountOptionRow>
    );
};
