/**
 * A UI label owned by a network family, in the shape both react-intl and the translation tooling
 * already understand. Families reuse existing translation ids, so a label is translated wherever
 * that id is.
 */
export type Label = {
    readonly id: string;
    readonly defaultMessage: string;
};
