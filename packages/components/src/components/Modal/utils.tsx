import { ModalAlignment, ModalSize } from './types';
import { UIAlignment } from '../../config/types';
import { FlexAlignItems, FlexJustifyContent } from '../Flex/Flex';

export const mapModalSizeToWidth = (size: ModalSize) => {
    const widthMap: Record<ModalSize, number> = {
        tiny: 400,
        small: 600,
        medium: 680,
        large: 760,
        huge: 960,
    };

    return widthMap[size];
};

export const mapAlignmentToJustifyContent = (alignment: ModalAlignment): FlexJustifyContent => {
    const alignmentMap: Record<UIAlignment, FlexJustifyContent> = {
        center: 'center',
        start: 'flex-start',
        end: 'flex-end',
    };

    return alignmentMap[alignment.y];
};

export const mapAlignmentToAlignItems = (alignment: ModalAlignment): FlexAlignItems => {
    const alignmentMap: Record<UIAlignment, FlexAlignItems> = {
        center: 'center',
        start: 'flex-start',
        end: 'flex-end',
    };

    return alignmentMap[alignment.x];
};
