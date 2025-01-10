import { Control } from 'react-hook-form';

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
import {
    AccountFormValues,
    AccountLabelFieldHint,
    MAX_ACCOUNT_LABEL_LENGTH,
} from '@suite-native/accounts';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type AssetsOverviewProps = {
    balance: string;
    symbol: NetworkSymbol;
    formControl: Control<AccountFormValues>;
};

export const AccountImportOverview = ({ balance, symbol, formControl }: AssetsOverviewProps) => {
    const { translate } = useTranslate();

    const fiatBalanceValue = useFiatFromCryptoValue({
        cryptoValue: balance,
        symbol,
    });
    const coinLabelFieldLabel = translate(
        'moduleAccountManagement.accountSettingsScreen.renameForm.coinLabel',
    );

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
                <VStack spacing="sp8">
                    <TextInputField
                        testID="@account-import/coin-synced/label-input"
                        name="accountLabel"
                        label={coinLabelFieldLabel}
                        maxLength={MAX_ACCOUNT_LABEL_LENGTH}
                        elevation="1"
                    />
                    <AccountLabelFieldHint formControl={formControl} />
                </VStack>
            </VStack>
        </AccountImportOverviewCard>
    );
};
