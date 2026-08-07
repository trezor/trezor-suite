import { type Rating } from '@suite-common/feedback';
import { Button } from '@suite-native/atoms';

type EmojiRatingButtonProps = {
    rating: Rating;
    emoji: string;
    onPress: (rating: Rating) => void;
    isSelected?: boolean;
    testID?: string;
};

export const EmojiRatingButton = ({
    rating,
    emoji,
    isSelected,
    onPress,
    testID = `@feedback-form/rating/${rating}`,
}: EmojiRatingButtonProps) => (
    <Button
        onPress={() => onPress(rating)}
        accessibilityState={{ selected: isSelected }}
        testID={testID}
        intent="neutral"
        priority={isSelected ? 'primary' : 'secondary'}
        size="medium"
    >
        {emoji}
    </Button>
);
