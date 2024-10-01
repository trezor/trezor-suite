import { useSelector } from 'react-redux';

import { CryptoIcon } from '@suite-common/icons-deprecated';
import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
    selectAccountAvailableBalance,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { VStack, HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { ScreenSubHeader, GoBackIcon, ScreenSubHeaderProps } from '@suite-native/navigation';
import { nativeSpacings } from '@trezor/theme';

type AccountBalanceScreenHeaderProps = {
    accountKey?: AccountKey;
};

export const SendScreenSubHeader = (props: ScreenSubHeaderProps) => (
    <ScreenSubHeader {...props} customHorizontalPadding={nativeSpacings.sp16} />
);

export const AccountBalanceScreenHeader = ({ accountKey }: AccountBalanceScreenHeaderProps) => {
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
        <SendScreenSubHeader
            content={
                <VStack spacing="sp4" alignItems="center">
                    <HStack spacing="sp8" alignItems="center">
                        {networkSymbol && <CryptoIcon symbol={networkSymbol} size="extraSmall" />}
                        {accountLabel && <Text variant="highlight">{accountLabel}</Text>}
                    </HStack>
                    <HStack spacing="sp4" alignItems="center">
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
