import { useFormatters } from '@suite-common/formatters';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { selectBaseCurrency, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, isUtxoBased } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountLabeling, Address, CoinBalance, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { TradingReceiveOptionRow } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveOptionRow';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

type TradingReceiveAccountSuiteOptionProps = {
    account: Account;
};

export const TradingReceiveAccountSuiteOption = ({
    account,
}: TradingReceiveAccountSuiteOptionProps) => {
    const { tradingReceiveAddress, extraFieldDescription } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const baseCurrency = useSelector(selectBaseCurrency);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
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
            isDisabled={isDiscoveryRunning}
            onClick={onOptionClick}
        >
            <Row gap={12}>
                <CoinLogo size={24} symbol={account.symbol} />

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
                            value={address ?? null}
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

                {(isUtxoBasedNetwork || requiresExtraField) && (
                    <Icon name="caretRight" size={20} intent="neutral" priority="secondary" />
                )}
            </Row>
        </TradingReceiveOptionRow>
    );
};
