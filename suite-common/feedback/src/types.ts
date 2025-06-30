import { DeviceModelInternal } from '@trezor/device-utils';
import { Environment } from '@trezor/env-utils';

import { ratingOptions } from './constants';

type RatingId = (typeof ratingOptions)[number]['id'];
type RatingEmoji = (typeof ratingOptions)[number]['emoji'];

export type RatingOption = {
    id: RatingId;
    emoji: RatingEmoji;
};

export type FeedbackType = 'BUG' | 'SUGGESTION';

export type FeedbackCategory =
    | 'dashboard'
    | 'account'
    | 'settings'
    | 'send'
    | 'receive'
    | 'trade'
    | 'other';

export enum FeedbackEmoji {
    ANGRY = '😡',
    SAD = '😞',
    NEUTRAL = '😐',
    HAPPY = '🙂',
    LOVE = '😍',
}

export type RatingItem = {
    id: Rating;
    emoji: FeedbackEmoji;
};

export type Rating = '1' | '2' | '3' | '4' | '5'; // 1 = worst, 5 = best. Portrayed as Emojis in the UI to minimize the comprehension barrier

export interface UserData {
    platform: Environment;
    os: string;
    user_agent: string;
    suite_version: string;
    suite_revision: string;
    window_dimensions: string;
    device_model?: DeviceModelInternal;
    firmware_version: string;
    firmware_revision: string;
    firmware_type: string;
}

type FeedbackExtras = Record<string, string | number | boolean | undefined>;

interface BasePayload extends UserData, FeedbackExtras {
    description: string;
}

export interface BugPayload extends BasePayload {
    category: FeedbackCategory;
}

export interface SuggestionPayload extends BasePayload {
    rating?: Rating;
    category?: FeedbackCategory;
}

export type Feedback =
    | { type: 'BUG'; payload: BugPayload }
    | { type: 'SUGGESTION'; payload: SuggestionPayload };
