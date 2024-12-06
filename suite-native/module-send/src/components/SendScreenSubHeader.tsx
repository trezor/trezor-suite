import { useSelector } from 'react-redux';

import { CryptoIcon } from '@suite-native/icons';
import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
    selectAccountBalance,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { VStack, HStack, Text } from '@suite-native/atoms';
import { CoinAmountFormatter, CoinToFiatAmountFormatter } from '@suite-native/formatters';
import { ScreenSubHeader, GoBackIcon, ScreenSubHeaderProps } from '@suite-native/navigation';
import { nativeSpacings } from '@trezor/theme';
import {
    selectAccountTokenBalance,
    selectAccountTokenSymbol,
    TokensRootState,
} from '@suite-native/tokens';
import { isTestnet } from '@suite-common/wallet-utils';

type AccountBalanceScreenHeaderProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const SendScreenSubHeader = (props: ScreenSubHeaderProps) => (
    <ScreenSubHeader {...props} customHorizontalPadding={nativeSpacings.sp16} />
);

export const AccountBalanceScreenHeader = ({
    accountKey,
    tokenContract,
}: AccountBalanceScreenHeaderProps) => {
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const balance = useSelector((state: AccountsRootState) =>
        selectAccountBalance(state, accountKey),
    );

    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );

    if (!symbol) {
        return;
    }

    const accountTitle = tokenSymbol ? `${accountLabel} – ${tokenSymbol}` : accountLabel;

    return (
        <SendScreenSubHeader
            content={
                <VStack spacing="sp4" alignItems="center">
                    <HStack spacing="sp8" alignItems="center">
                        {symbol && (
                            <CryptoIcon
                                symbol={symbol}
                                contractAddress={tokenContract}
                                size="extraSmall"
                            />
                        )}
                        {accountTitle && <Text variant="highlight">{accountTitle}</Text>}
                    </HStack>
                    <HStack spacing="sp4" alignItems="center">
                        <CoinAmountFormatter
                            variant="hint"
                            color="textDefault"
                            value={tokenBalance ?? balance}
                            decimals={0}
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                            isBalance={false}
                        />
                        {!isTestnet(symbol) && (
                            <>
                                <Text variant="hint" color="textSubdued">
                                    ≈
                                </Text>
                                <CoinToFiatAmountFormatter
                                    variant="hint"
                                    color="textSubdued"
                                    value={tokenBalance ?? balance}
                                    accountKey={accountKey}
                                    decimals={0}
                                    tokenContract={tokenContract}
                                />
                            </>
                        )}
                    </HStack>
                </VStack>
            }
            leftIcon={<GoBackIcon />}
        />
    );
};
