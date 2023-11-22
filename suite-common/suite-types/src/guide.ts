import { DeviceModelInternal } from '@trezor/connect';
import { Environment } from '@trezor/env-utils';

/**
 * A group of Guide content.
 * Can contain other Pages or Categories.
 * Cannot contain content on its own except the title.
 */
export interface GuideCategory {
    type: 'category';
    /** Serves both as unique identifier and relative path to the directory. */
    id: string;
    /** List of locales this Category is available in. */
    locales: string[];
    /** Titles keyed by locales. */
    title: {
        [key: string]: string;
    };
    image?: string;
    /** Sub-categories and sub-pages. */
    children: GuideNode[];
}

/** A single unit of Guide content. */
export interface GuideArticle {
    type: 'page';
    id: string;
    locales: string[];
    title: {
        [key: string]: string;
    };
}

export type GuideNode = GuideCategory | GuideArticle;

export type GuideView = 'GUIDE_DEFAULT' | 'GUIDE_CATEGORY' | 'GUIDE_ARTICLE';

export type FeedbackView = 'SUPPORT_FEEDBACK_SELECTION' | 'FEEDBACK_BUG' | 'FEEDBACK_SUGGESTION';

export type ActiveView = GuideView | FeedbackView;

export type FeedbackCategory =
    | 'dashboard'
    | 'account'
    | 'settings'
    | 'send'
    | 'receive'
    | 'trade'
    | 'other';

export type Rating = '1' | '2' | '3' | '4' | '5'; // 1 = worst, 5 = best. Portrayed as Emojis in the UI to minimize the comprehension barrier

export type FeedbackType = 'BUG' | 'SUGGESTION';

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

export interface PayloadBug extends UserData {
    description: string;
    category: FeedbackCategory;
}

export interface PayloadSuggestion extends UserData {
    description: string;
    rating?: Rating;
}

export type FeedbackBug = {
    type: 'BUG';
    payload: PayloadBug;
};

export type FeedbackSuggestion = {
    type: 'SUGGESTION';
    payload: PayloadSuggestion;
};

export type Feedback = FeedbackBug | FeedbackSuggestion;
