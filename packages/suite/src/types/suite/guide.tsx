/* eslint-disable camelcase */
import { Page, Category, Node } from '@trezor/suite-data/src/guide/parser';

import type { EnvironmentType } from '@suite-types';

export type GuideView = 'GUIDE_DEFAULT' | 'GUIDE_CATEGORY' | 'GUIDE_PAGE';

export type FeedbackView = 'FEEDBACK_TYPE_SELECTION' | 'FEEDBACK_BUG' | 'FEEDBACK_SUGGESTION';

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
    platform: EnvironmentType;
    os: string;
    user_agent: string;
    suite_version: string;
    suite_revision: string;
    window_dimensions: string;
    device_type: string;
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

export type { Page, Category, Node };
