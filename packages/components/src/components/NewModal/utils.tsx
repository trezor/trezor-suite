import { NewModalSize, NewModalAlignment } from './types';
import { UIVerticalAlignment, UIHorizontalAlignment } from '../../config/types';

export const mapModalSizeToWidth = (size: NewModalSize) => {
    const widthMap: Record<NewModalSize, number> = {
        tiny: 400,
        small: 600,
        medium: 680,
        large: 760,
    };

    return widthMap[size];
};

export const mapAlignmentToJustifyContent = (alignment: NewModalAlignment) => {
    const alignmentMap: Record<UIVerticalAlignment, string> = {
        center: 'center',
        top: 'flex-start',
        bottom: 'flex-end',
    };

    return alignmentMap[alignment.y];
};

export const mapAlignmentToAlignItems = (alignment: NewModalAlignment) => {
    const alignmentMap: Record<UIHorizontalAlignment, string> = {
        center: 'center',
        left: 'flex-start',
        right: 'flex-end',
    };

    return alignmentMap[alignment.x];
};
