import { getLuminance } from 'polished';

import { CSSColor } from '@trezor/theme';

export const getValueAndUnit = (valueAndUnit: string): [value: number, unit: string] => {
    const value = parseFloat(valueAndUnit);
    const [unit] = valueAndUnit.match(/([a-zA-Z]*|%)$/) ?? [''];

    return [value, unit];
};

export const multiply = (ratio: number, valueAndUnit: string) => {
    const [value, unit] = getValueAndUnit(valueAndUnit);

    return ratio * Number(value) + unit;
};

export const sum = (valuesAndUnits: string[]) => {
    const valueUnitPairs = valuesAndUnits.map(getValueAndUnit);

    if (valueUnitPairs.length === 0) {
        return '';
    }

    return `${valueUnitPairs.reduce((accumulator, [value]) => accumulator + value, 0)}${
        valueUnitPairs[0][1]
    }`;
};

export const negative = (value: number): number => {
    if (value <= 0) return value;

    return value * -1;
};

export const isDarkColor = (color: CSSColor) => {
    const luminance = getLuminance(color);

    return luminance < 0.5;
};
