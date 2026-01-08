import { useFormatters } from '@suite-common/formatters';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, isUtxoBased } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import {
    AccountLabeling,
    AddressLabel,
    CoinBalance,
    HiddenPlaceholder,
} from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingReceiveOptionRow } from '../TradingReceiveOptionRow';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

interface TradingReceiveAccountSuiteOptionProps {
    account: Account;
}

export const TradingReceiveAccountSuiteOption = ({
    account,
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
        tradingReceiveAddress.onChangeAccount(account);
        modalControls.close();

        if (isUtxoBasedNetwork) {
            modalControls.open('utxoAddressModal');
        }

        if (requiresExtraField) {
            modalControls.open('extraFieldModal');
        }
    };

    return (
        <TradingReceiveOptionRow
            data-testid="@trading/receive-account-modal/option/suite"
            onClick={onOptionClick}
        >
            <Row gap={12}>
                <CoinLogo size={40} symbol={account.symbol} />
                <Column alignItems="flex-start">
                    <Text typographyStyle="body">
                        <AccountLabeling
                            account={account}
                            accountTypeBadgeSize="small"
                            showAccountTypeBadge
                        />
                    </Text>
                    {!isUtxoBasedNetwork && (
                        <AddressLabel
                            typographyStyle="hint"
                            variant="tertiary"
                            account={account}
                            address={address}
                        />
                    )}
                </Column>
            </Row>

            <Row gap={12}>
                <Column alignItems="flex-end">
                    <Text typographyStyle="body">
                        <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
                    </Text>
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
        </TradingReceiveOptionRow>
    );
};
