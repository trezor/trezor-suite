import { FeedbackEmoji, RatingItem } from './types';

export const FEEDBACK_ENDPOINT = 'https://data.trezor.io/suite';

export const ratingOptions: RatingItem[] = [
    {
        id: '1',
        emoji: FeedbackEmoji.ANGRY,
    },
    {
        id: '2',
        emoji: FeedbackEmoji.SAD,
    },
    {
        id: '3',
        emoji: FeedbackEmoji.NEUTRAL,
    },
    {
        id: '4',
        emoji: FeedbackEmoji.HAPPY,
    },
    {
        id: '5',
        emoji: FeedbackEmoji.LOVE,
    },
];
