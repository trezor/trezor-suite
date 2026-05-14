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
export type ShortcutsView = 'KEYBOARD_SHORTCUTS';

export type ActiveView = GuideView | FeedbackView | ShortcutsView;
