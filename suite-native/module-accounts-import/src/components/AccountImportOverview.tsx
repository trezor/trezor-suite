import { getNetwork, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    CryptoAmountFormatter,
    FiatBalanceFormatter,
    useFiatFromCryptoValue,
} from '@suite-native/formatters';
import { RoundedIcon, VStack } from '@suite-native/atoms';
import { isTestnet } from '@suite-common/wallet-utils';
import { TextInputField } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type AssetsOverviewProps = {
    balance: string;
    symbol: NetworkSymbol;
};

export const AccountImportOverview = ({ balance, symbol }: AssetsOverviewProps) => {
    const { translate } = useTranslate();

    const fiatBalanceValue = useFiatFromCryptoValue({
        cryptoValue: balance,
        symbol,
    });
    const coinLabelFieldLabel = translate(
        'moduleAccountManagement.accountSettingsScreen.renameForm.coinLabel',
    );

    // TODO 9052
    return (
        <AccountImportOverviewCard
            icon={<RoundedIcon symbol={symbol} iconSize="large" />}
            coinName={getNetwork(symbol).name}
            cryptoAmount={
                <CryptoAmountFormatter
                    value={balance}
                    symbol={symbol}
                    isDiscreetText={false}
                    isBalance={false}
                    variant="label"
                />
            }
        >
            <VStack spacing="sp24">
                {!isTestnet(symbol) && <FiatBalanceFormatter value={fiatBalanceValue} />}
                <TextInputField
                    testID="@account-import/coin-synced/label-input"
                    name="accountLabel"
                    label={coinLabelFieldLabel}
                    elevation="1"
                />
            </VStack>
        </AccountImportOverviewCard>
    );
};
