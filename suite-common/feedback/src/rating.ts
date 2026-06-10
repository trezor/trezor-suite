export type Rating = '1' | '2' | '3' | '4' | '5'; // 1 = worst, 5 = best. Portrayed as Emojis in the UI to minimize the comprehension barrier

/** Intentionally not exported, used only to name Emojis */
enum RatingEmojiEnum {
    ANGRY = '😡',
    SAD = '😞',
    NEUTRAL = '😐',
    HAPPY = '🙂',
    LOVE = '😍',
}

type RatingItem = {
    id: Rating;
    emoji: RatingEmojiEnum;
};

export const ratingOptions: RatingItem[] = [
    {
        id: '1',
        emoji: RatingEmojiEnum.ANGRY,
    },
    {
        id: '2',
        emoji: RatingEmojiEnum.SAD,
    },
    {
        id: '3',
        emoji: RatingEmojiEnum.NEUTRAL,
    },
    {
        id: '4',
        emoji: RatingEmojiEnum.HAPPY,
    },
    {
        id: '5',
        emoji: RatingEmojiEnum.LOVE,
    },
];
