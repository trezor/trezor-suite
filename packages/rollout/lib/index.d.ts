import { getScore } from './utils/score';
import { Input, Release } from './types';
declare const getLatestSafeFw: (input: Input, score?: number | undefined) => {
    firmware: Release;
    isLatest: boolean;
    isRequired: boolean;
    isNewer: boolean | null;
} | null;
export { getLatestSafeFw, getScore };
