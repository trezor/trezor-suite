import { PressableOpacity } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

const DISMISS_BUTTON_HIT_SLOP = 12;

type FeedbackCardDismissButtonProps = {
    onPress: () => void;
};

export const FeedbackCardDismissButton = ({ onPress }: FeedbackCardDismissButtonProps) => {
    const { translate } = useTranslate();

    return (
        <PressableOpacity
            onPress={onPress}
            hitSlop={DISMISS_BUTTON_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={translate('generic.buttons.dismiss')}
            testID="@feedback-form/dismiss-button"
        >
            <Icon name="x" size="medium" color="contentSecondary" />
        </PressableOpacity>
    );
};
