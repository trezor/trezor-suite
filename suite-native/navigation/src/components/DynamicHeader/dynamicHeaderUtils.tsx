import { type ReactElement, type ReactNode, isValidElement } from 'react';

import { DynamicScreenHeader, type DynamicScreenHeaderProps } from './DynamicScreenHeader';

export const isScreenHeaderPropDynamic = (
    element: ReactNode,
): element is ReactElement<DynamicScreenHeaderProps> =>
    isValidElement(element) && element.type === DynamicScreenHeader;
