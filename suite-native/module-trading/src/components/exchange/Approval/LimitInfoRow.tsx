import type { PropsWithChildren } from 'react';

import type { CryptoId, DexApprovalType } from 'invity-api';

import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

type LimitInfoRowProps = PropsWithChildren<{
    cryptoId: CryptoId;
    amount: string | undefined;
    approvalType: DexApprovalType | undefined;
    onPress?: () => void;
    testID?: string;
    withCaret?: boolean;
}>;

export const LimitInfoRow = ({
    cryptoId,
    amount,
    approvalType,
    onPress,
    testID,
    withCaret,
    children,
}: LimitInfoRowProps) => {
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(cryptoId);

    return (
        <TradeInfoRow onPress={onPress} testID={testID}>
            <VStack flex={1}>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text variant="body-sm">
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.limitLabel" />
                    </Text>
                    <HStack alignItems="center">
                        {!!network?.symbol && (
                            <CryptoIcon
                                symbol={network.symbol}
                                contractAddress={contractAddress}
                                size="extraSmall"
                            />
                        )}
                        {approvalType === 'INFINITE' ? (
                            <Text variant="body-sm-strong">
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                            </Text>
                        ) : (
                            <TradingCoinAmountFormatter
                                amount={amount}
                                cryptoId={cryptoId}
                                variant="body-sm-strong"
                                color="textDefault"
                            />
                        )}
                        {withCaret && <Icon name="caretDown" size="medium" />}
                    </HStack>
                </HStack>
                {children}
            </VStack>
        </TradeInfoRow>
    );
};
