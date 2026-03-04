import { FlagSize, FlagType, isFlagType } from './types';

export const mapSizeToOutlineWidth = (size: FlagSize): number => {
    const outlineWidthMap: Record<FlagSize, number> = {
        16: 1,
        20: 1,
        24: 1,
        32: 2,
        40: 2,
        48: 2,
    };

    return outlineWidthMap[size];
};

export const mapSizeToBorderRadius = (size: FlagSize): number => {
    const borderRadiusMap: Record<FlagSize, number> = {
        16: 2,
        20: 2,
        24: 4,
        32: 6,
        40: 6,
        48: 8,
    };

    return borderRadiusMap[size];
};

export const getCountryFlag = (countryCode?: string): FlagType | undefined => {
    if (!countryCode) {
        return undefined;
    }

    if (['unknown', 'XX', 'T1'].includes(countryCode)) {
        return 'UNKNOWN';
    }

    if (isFlagType(countryCode)) {
        return countryCode;
    }

    return undefined;
};
