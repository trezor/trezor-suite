import { NewModalAlignment, NewModalSize } from './types';
import { UIHorizontalAlignment, UIVerticalAlignment } from '../../config/types';
import { FlexAlignItems, FlexJustifyContent } from '../Flex/Flex';

export const mapModalSizeToWidth = (size: NewModalSize) => {
    const widthMap: Record<NewModalSize, number> = {
        tiny: 400,
        small: 600,
        medium: 680,
        large: 760,
        huge: 960,
    };

    return widthMap[size];
};

export const mapAlignmentToJustifyContent = (alignment: NewModalAlignment): FlexJustifyContent => {
    const alignmentMap: Record<UIVerticalAlignment, FlexJustifyContent> = {
        center: 'center',
        top: 'flex-start',
        bottom: 'flex-end',
    };

    return alignmentMap[alignment.y];
};

export const mapAlignmentToAlignItems = (alignment: NewModalAlignment): FlexAlignItems => {
    const alignmentMap: Record<UIHorizontalAlignment, FlexAlignItems> = {
        center: 'center',
        left: 'flex-start',
        right: 'flex-end',
    };

    return alignmentMap[alignment.x];
};
