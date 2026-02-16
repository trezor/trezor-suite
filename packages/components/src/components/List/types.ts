import { uiAlignments } from '../../config/types';
import { textIntents } from '../typography/Text/Text';

export const listIntents = textIntents;
export type ListIntent = (typeof listIntents)[number];

export const bulletVerticalAlignments = uiAlignments;
export type BulletVerticalAlignment = (typeof bulletVerticalAlignments)[number];

export type ListStyleType =
    | 'disc'
    | 'circle'
    | 'square'
    | 'decimal'
    | 'decimal-leading-zero'
    | 'lower-roman'
    | 'upper-roman'
    | 'lower-alpha'
    | 'upper-alpha';
