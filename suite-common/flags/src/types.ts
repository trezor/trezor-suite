import { FLAGS } from './flags';

export type FlagType = keyof typeof FLAGS;

export const flagSizes = [16, 20, 24, 32, 40, 48] as const;
export type FlagSize = (typeof flagSizes)[number];

export const isFlagType = (value?: string): value is FlagType => {
    if (!value) {
        return false;
    }

    return Object.hasOwn(FLAGS, value);
};
