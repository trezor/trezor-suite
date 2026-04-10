import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import {
    AnimatedBox,
    AnimatedText,
    AnimatedVStack,
    Badge,
    InlineAlertBox,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { TradingConfirmationVariant } from '@suite-native/navigation';
import { IconWithSpinner } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

export type ExchangeConfirmationTitleProps = {
    variant: TradingConfirmationVariant;
    isPending: boolean;
    isFailed: boolean;
};

const TitleTranslation = ({ variant }: { variant: TradingConfirmationVariant }) => {
    switch (variant) {
        case 'approve':
            return <Translation id="moduleTrading.tradingConfirmationScreen.approveTitle" />;
        case 'revoke':
            return <Translation id="moduleTrading.tradingConfirmationScreen.revokeTitle" />;
        default:
            return exhaustive(variant);
    }
};

export const ExchangeConfirmationTitle = ({
    variant,
    isFailed,
    isPending,
}: ExchangeConfirmationTitleProps) => (
    <VStack spacing="sp16" paddingVertical="sp16" alignItems="stretch">
        {isPending && (
            <AnimatedVStack entering={FadeIn} exiting={FadeOut} alignItems="center">
                <IconWithSpinner iconName="arrowUp" />
                <Badge
                    label={<Translation id="moduleTrading.tradingConfirmationScreen.pending" />}
                    size="medium"
                    variant="yellow"
                />
            </AnimatedVStack>
        )}
        <AnimatedVStack spacing="sp6" alignItems="flex-start" layout={LinearTransition}>
            <Text variant="headline-md">
                <TitleTranslation variant={variant} />
            </Text>
            {isFailed ? (
                <AnimatedBox
                    layout={LinearTransition}
                    entering={FadeIn}
                    exiting={FadeOut}
                    alignSelf="stretch"
                >
                    <InlineAlertBox
                        title={<Translation id="moduleTrading.tradingConfirmationScreen.error" />}
                        variant="critical"
                    />
                </AnimatedBox>
            ) : (
                <AnimatedText color="textSubdued">
                    <Translation id="moduleTrading.tradingConfirmationScreen.subtitle" />
                </AnimatedText>
            )}
        </AnimatedVStack>
    </VStack>
);
