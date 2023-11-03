import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    CryptoAmountFormatter,
    FiatBalanceFormatter,
    useFiatFromCryptoValue,
} from '@suite-native/formatters';
import { RoundedIcon, VStack } from '@suite-native/atoms';
import { isTestnet } from '@suite-common/wallet-utils';
import { TextInputField } from '@suite-native/forms';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type AssetsOverviewProps = {
    balance: string;
    networkSymbol: NetworkSymbol;
};

export const AccountImportOverview = ({ balance, networkSymbol }: AssetsOverviewProps) => {
    const fiatBalanceValue = useFiatFromCryptoValue({
        cryptoValue: balance,
        network: networkSymbol,
    });
    return (
        <AccountImportOverviewCard
            icon={<RoundedIcon name={networkSymbol} iconSize="large" />}
            coinName={networks[networkSymbol].name}
            symbol={networkSymbol}
            cryptoAmount={
                <CryptoAmountFormatter
                    value={balance}
                    network={networkSymbol}
                    isDiscreetText={false}
                    isBalance={false}
                    variant="label"
                />
            }
        >
            <VStack spacing="large">
                {!isTestnet(networkSymbol) && <FiatBalanceFormatter value={fiatBalanceValue} />}
                <TextInputField
                    testID="@account-import/coin-synced/label-input"
                    name="accountLabel"
                    label="Coin label"
                    elevation="1"
                />
            </VStack>
        </AccountImportOverviewCard>
    );
};
