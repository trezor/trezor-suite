import type { ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';

import type { DynamicScreenHeaderProps } from './DynamicScreenHeader';
import { DynamicScreenHeader } from './DynamicScreenHeader';

export const isScreenHeaderPropDynamic = (
    element: ReactNode,
): element is ReactElement<DynamicScreenHeaderProps> =>
    isValidElement(element) && element.type === DynamicScreenHeader;
