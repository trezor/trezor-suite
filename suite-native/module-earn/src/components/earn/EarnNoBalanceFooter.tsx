import { Button, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { EarnScreenFooter } from './EarnScreenFooter';

type EarnNoBalanceFooterProps = {
    displaySymbol: string;
    onBuyPress?: () => void;
    onReceivePress?: () => void;
    onSwapPress?: () => void;
};

export const EarnNoBalanceFooter = ({
    displaySymbol,
    onBuyPress,
    onReceivePress,
    onSwapPress,
}: EarnNoBalanceFooterProps) => {
    if (!onBuyPress && !onReceivePress && !onSwapPress) {
        return null;
    }

    const buyButton = onBuyPress && (
        <Button iconLeft="creditCard" onPress={onBuyPress} testID="@earn/no-balance/buy-button">
            <Translation id="earn.noBalance.buyButton" values={{ displaySymbol }} />
        </Button>
    );

    if (onSwapPress) {
        return (
            <EarnScreenFooter>
                <VStack spacing="sp12">
                    <HStack spacing="sp12">
                        <Button
                            flex={1}
                            iconLeft="arrowsLeftRight"
                            intent="neutral"
                            priority="secondary"
                            onPress={onSwapPress}
                            testID="@earn/no-balance/swap-button"
                        >
                            <Translation id="earn.noBalance.swapButton" />
                        </Button>
                        {onReceivePress && (
                            <Button
                                flex={1}
                                iconLeft="qrCode"
                                intent="neutral"
                                priority="secondary"
                                onPress={onReceivePress}
                                testID="@earn/no-balance/receive-button"
                            >
                                <Translation id="earn.noBalance.receiveShortButton" />
                            </Button>
                        )}
                    </HStack>
                    {buyButton}
                </VStack>
            </EarnScreenFooter>
        );
    }

    return (
        <EarnScreenFooter>
            <VStack spacing="sp12">
                {buyButton}
                {onReceivePress && (
                    <Button
                        iconLeft="qrCode"
                        intent="neutral"
                        priority="secondary"
                        onPress={onReceivePress}
                        testID="@earn/no-balance/receive-button"
                    >
                        <Translation id="earn.noBalance.receiveButton" values={{ displaySymbol }} />
                    </Button>
                )}
            </VStack>
        </EarnScreenFooter>
    );
};
