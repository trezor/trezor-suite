import { type Rating } from '@suite-common/feedback';
import { PressableOpacity, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type EmojiRatingOptionProps = {
    id: Rating;
    emoji: string;
    isSelected: boolean;
    onPress: (id: Rating) => void;
};

const emojiButtonStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isSelected
        ? utils.colors.legacyBackgroundPrimaryDefault
        : utils.colors.legacyBackgroundTertiaryDefaultOnElevation1,
}));

export const EmojiRatingOption = ({ id, emoji, isSelected, onPress }: EmojiRatingOptionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity
            onPress={() => onPress(id)}
            style={applyStyle(emojiButtonStyle, { isSelected })}
        >
            <Text variant="headline-sm">{emoji}</Text>
        </PressableOpacity>
    );
};
