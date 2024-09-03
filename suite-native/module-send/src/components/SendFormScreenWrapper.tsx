import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useNativeStyles } from '@trezor/styles';
import { GoBackIcon, Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Text, HStack, VStack } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { CryptoIcon } from '@suite-common/icons-deprecated';
import {
    AccountsRootState,
    selectAccountAvailableBalance,
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';

type SendScreenSubHeaderProps = {
    accountKey?: AccountKey;
};

const SendScreenSubHeader = ({ accountKey }: SendScreenSubHeaderProps) => {
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const availableBalance = useSelector((state: AccountsRootState) =>
        selectAccountAvailableBalance(state, accountKey),
    );

    if (!networkSymbol) {
        return;
    }

    return (
        <ScreenSubHeader
            content={
                <VStack spacing="extraSmall" alignItems="center">
                    <HStack spacing="small" alignItems="center">
                        {networkSymbol && <CryptoIcon symbol={networkSymbol} size="extraSmall" />}
                        {accountLabel && <Text variant="highlight">{accountLabel}</Text>}
                    </HStack>
                    <HStack spacing="extraSmall" alignItems="center">
                        <CryptoAmountFormatter
                            variant="hint"
                            value={availableBalance}
                            network={networkSymbol}
                            isBalance={false}
                            color="textDefault"
                        />
                        <Text variant="hint" color="textSubdued">
                            ≈
                        </Text>
                        <CryptoToFiatAmountFormatter
                            value={availableBalance}
                            network={networkSymbol}
                            variant="hint"
                            color="textSubdued"
                        />
                    </HStack>
                </VStack>
            }
            leftIcon={<GoBackIcon />}
        />
    );
};

type SendScreenProps = {
    children: ReactNode;
    accountKey?: AccountKey;
};

export const SendFormScreenWrapper = ({ children, accountKey }: SendScreenProps) => {
    const { utils } = useNativeStyles();

    return (
        <Screen
            customHorizontalPadding={utils.spacings.medium}
            subheader={<SendScreenSubHeader accountKey={accountKey} />}
        >
            {children}
        </Screen>
    );
};
