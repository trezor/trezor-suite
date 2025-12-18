import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedBox, InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { WaitingCard, type WaitingCardProps } from '@suite-native/trading-atoms';
import { ProviderConfirmationStatus } from '@suite-native/trading-types';

export type ConfirmationInProgressProps = {
    status: ProviderConfirmationStatus;
    loadingState: WaitingCardProps['loadingState'];
};
export const ConfirmationInProgress = ({ status, loadingState }: ConfirmationInProgressProps) => {
    const isClosedIncomplete = status === 'window_closed_incomplete';

    const title = isClosedIncomplete ? (
        <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.confirming" />
    ) : (
        <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.waitingForAddress" />
    );

    return (
        <WaitingCard
            title={title}
            subtitle={
                <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.upTo30Seconds" />
            }
            loadingState={loadingState}
        >
            {isClosedIncomplete && (
                <AnimatedBox
                    entering={FadeIn}
                    exiting={FadeOut}
                    alignSelf="stretch"
                    paddingTop="sp16"
                >
                    <InlineAlertBox
                        title={
                            <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.startOver" />
                        }
                        iconName="info"
                        variant="info"
                    />
                </AnimatedBox>
            )}
        </WaitingCard>
    );
};
