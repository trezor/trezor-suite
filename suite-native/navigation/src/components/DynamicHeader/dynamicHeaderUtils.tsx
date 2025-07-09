import { ReactElement, ReactNode, isValidElement } from 'react';

import { DynamicScreenHeader, DynamicScreenHeaderProps } from './DynamicScreenHeader';

export const isScreenHeaderPropDynamic = (
    element: ReactNode,
): element is ReactElement<DynamicScreenHeaderProps> =>
    isValidElement(element) && element.type === DynamicScreenHeader;
