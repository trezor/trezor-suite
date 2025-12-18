import { ModalAlignment } from './types';
import { UIAlignment } from '../../config/types';
import { FlexAlignItems, FlexJustifyContent } from '../Flex/FlexProp';

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
