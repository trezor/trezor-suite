import { Address } from '@suite/address';
import { useFormatters } from '@suite-common/formatters';
import { useSelector } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { type Address as AddressType } from '@trezor/blockchain-link-types';
import { CardList, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { CoinBalance } from 'src/components/suite';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';

interface UtxoReceiveAddressOptionProps {
    account: Account;
    address: AddressType;
    onAddressSelect: (address: string) => void;
}

export const UtxoReceiveAddressOption = ({
    account,
    address,
    onAddressSelect,
}: UtxoReceiveAddressOptionProps) => {
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

    return (
        <CardList.Item onClick={() => onAddressSelect(address.address)}>
            <Row width="100%" gap={12} justifyContent="space-between">
                <Row gap={12}>
                    <TokenIcon size={24} symbol={account.symbol} />

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
        </CardList.Item>
    );
};
