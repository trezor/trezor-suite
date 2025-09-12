import { Rating } from './rating';
import { UserData } from './userData';

export type FeedbackType = 'BUG' | 'SUGGESTION';

export type FeedbackCategory =
    | 'dashboard'
    | 'account'
    | 'settings'
    | 'send'
    | 'receive'
    | 'trade'
    | 'other';

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
