import { useFormatters } from '@suite-common/formatters';
import { getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { type Address as BlockchainLinkAddress } from '@trezor/blockchain-link-types';
import { Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { Address, CoinBalance } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { TradingReceiveOptionRow } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveOptionRow';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

interface TradingUtxoReceiveAddressOptionProps {
    account: Account;
    address: BlockchainLinkAddress;
}

export const TradingUtxoReceiveAddressOption = ({
    account,
    address,
}: TradingUtxoReceiveAddressOptionProps) => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const network = getNetwork(account.symbol);

    const baseCurrency = useSelector(selectBaseCurrency);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const balanceInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(address.received ?? '0')),
        symbol: account.symbol,
        decimals: network?.decimals,
    });

    const { fiatAmount } = useFiatFromCryptoValue({
        amount: balanceInUnits,
        symbol: account.symbol,
    });

    const onOptionClick = () => {
        tradingReceiveAddress.form.setValue('address', address.address);
        modalControls.close();
    };

    return (
        <TradingReceiveOptionRow
            data-testid="@trading/bitcoin-receive-address-modal/option"
            onClick={onOptionClick}
        >
            <Row width="100%" gap={12} justifyContent="space-between">
                <Row gap={12}>
                    <CoinLogo size={24} symbol={account.symbol} />
                    <Column alignItems="flex-start">
                        <Address isTruncated value={address.address} />
                    </Column>
                </Row>

                {!!address.received && address.received !== '0' && (
                    <Column alignItems="flex-end">
                        <CoinBalance value={balanceInUnits} symbol={account.symbol} />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <BaseCurrencyAmountFormatter
                                value={fiatAmount ?? BASE_CURRENCY_ZERO}
                                currency={baseCurrency}
                            />
                        </Text>
                    </Column>
                )}
            </Row>
        </TradingReceiveOptionRow>
    );
};
