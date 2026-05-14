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
import type { ConfirmingScreenFlowType } from '@suite-native/navigation';
import { IconWithSpinner } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

export type ExchangeConfirmationTitleProps = {
    flowType: ConfirmingScreenFlowType;
    isPending: boolean;
    isFailed: boolean;
};

const TitleTranslation = ({ flowType }: { flowType: ConfirmingScreenFlowType }) => {
    switch (flowType) {
        case 'approve':
            return <Translation id="moduleTrading.tradingConfirmationScreen.approveTitle" />;
        case 'revoke':
        case 'revoke-and-approve':
            return <Translation id="moduleTrading.tradingConfirmationScreen.revokeTitle" />;
        default:
            return exhaustive(flowType);
    }
};

export const ExchangeConfirmationTitle = ({
    flowType,
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
                    intent="warning"
                />
            </AnimatedVStack>
        )}
        <AnimatedVStack spacing="sp6" alignItems="flex-start" layout={LinearTransition}>
            <Text variant="headline-md">
                <TitleTranslation flowType={flowType} />
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
                <AnimatedText color="contentSecondary">
                    <Translation id="moduleTrading.tradingConfirmationScreen.subtitle" />
                </AnimatedText>
            )}
        </AnimatedVStack>
    </VStack>
);
