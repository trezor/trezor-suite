import { FadeInDown } from 'react-native-reanimated';

import { AnimatedView, Button, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { ConfirmingScreenFlowType } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

export type ExchangeConfirmationFooterProps = {
    flowType: ConfirmingScreenFlowType;
};

export const EXCHANGE_CONFIRMATION_BUTTON_TEST_ID = '@trading/exchange-confirmation/button';

const HintTranslation = ({ flowType }: ExchangeConfirmationFooterProps) => {
    switch (flowType) {
        case 'approve':
            return <Translation id="moduleTrading.tradingConfirmationScreen.approveHint" />;
        case 'revoke-and-approve':
            return (
                <Translation id="moduleTrading.tradingConfirmationScreen.revokeAndApproveHint" />
            );
        // A standalone revoke has nothing to sign next.
        case 'revoke':
            return <Translation id="moduleTrading.tradingConfirmationScreen.subtitle" />;
        default:
            return exhaustive(flowType);
    }
};

const ButtonTranslation = ({ flowType }: ExchangeConfirmationFooterProps) => {
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

export const ExchangeConfirmationFooter = ({ flowType }: ExchangeConfirmationFooterProps) => (
    <AnimatedView entering={FadeInDown}>
        <ScreenFooterGradient />
        <VStack spacing="sp12" paddingHorizontal="sp16" paddingBottom="sp16">
            <Text variant="body-sm" color="contentSecondary" textAlign="center">
                <HintTranslation flowType={flowType} />
            </Text>
            <Button isLoading testID={EXCHANGE_CONFIRMATION_BUTTON_TEST_ID}>
                <ButtonTranslation flowType={flowType} />
            </Button>
        </VStack>
    </AnimatedView>
);
