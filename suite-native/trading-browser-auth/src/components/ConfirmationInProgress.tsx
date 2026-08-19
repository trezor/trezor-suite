import { Translation } from '@suite-native/intl';
import { WaitingCard, type WaitingCardProps } from '@suite-native/trading-atoms';

export type ConfirmationInProgressProps = {
    loadingState: WaitingCardProps['loadingState'];
    companyName: string;
    onConfirmationComplete?: () => void;
};

const CONFIRMATION_IN_PROGRESS_TEST_ID = '@trading/sell-preview/provider-confirmation-in-progress';

export const ConfirmationInProgress = ({
    loadingState,
    companyName,
    onConfirmationComplete,
}: ConfirmationInProgressProps) => (
    <WaitingCard
        onComplete={onConfirmationComplete}
        title={
            <Translation
                id="moduleTrading.tradingSellCompletionScreen.finishingTitle"
                values={{ companyName }}
            />
        }
        subtitle={
            <Translation
                id="moduleTrading.tradingSellCompletionScreen.finishingSubtitle"
                values={{ companyName }}
            />
        }
        loadingState={loadingState}
        testID={CONFIRMATION_IN_PROGRESS_TEST_ID}
    />
);
