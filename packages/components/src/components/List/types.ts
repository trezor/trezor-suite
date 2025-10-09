import { uiAlignments } from '../../config/types';
import { textVariants } from '../typography/Text/Text';

export const listVariants = textVariants;
export type ListVariant = (typeof listVariants)[number];

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
