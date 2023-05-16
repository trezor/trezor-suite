import React from 'react';

import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIcon } from '@suite-common/icons';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Box } from '@suite-native/atoms';
import { isTestnet } from '@suite-common/wallet-utils';
import { TextInputField } from '@suite-native/forms';

import { AccountImportOverviewCard } from './AccountImportOverviewCard';

type AssetsOverviewProps = {
    balance: string;
    networkSymbol: NetworkSymbol;
};

export const AccountImportOverview = ({ balance, networkSymbol }: AssetsOverviewProps) => (
    <AccountImportOverviewCard
        icon={<CryptoIcon symbol={networkSymbol} size="large" />}
        coinName={networks[networkSymbol].name}
        symbol={networkSymbol}
        cryptoAmount={
            <CryptoAmountFormatter
                value={balance}
                network={networkSymbol}
                isBalance={false}
                variant="label"
            />
        }
    >
        {!isTestnet(networkSymbol) && (
            <Box marginBottom="large">
                <CryptoToFiatAmountFormatter
                    value={balance}
                    network={networkSymbol}
                    isDiscreetText={false}
                    variant="titleLarge"
                />
            </Box>
        )}
        <Box>
            <TextInputField
                data-testID="@account-import/coin-synced/label-input"
                name="accountLabel"
                label="Coin label"
            />
        </Box>
    </AccountImportOverviewCard>
);
