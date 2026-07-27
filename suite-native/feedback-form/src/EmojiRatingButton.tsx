import { type Rating } from '@suite-common/feedback';
import { Button } from '@suite-native/atoms';

type EmojiRatingButtonProps = {
    rating: Rating;
    emoji: string;
    isSelected: boolean;
    onPress: (rating: Rating) => void;
};

export const EmojiRatingButton = ({
    rating,
    emoji,
    isSelected,
    onPress,
}: EmojiRatingButtonProps) => (
    <Button
        onPress={() => onPress(rating)}
        accessibilityState={{ selected: isSelected }}
        testID={`@feedback-form/rating/${rating}`}
        intent="neutral"
        priority={isSelected ? 'primary' : 'secondary'}
        size="medium"
    >
        {emoji}
    </Button>
);
