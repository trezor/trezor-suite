import { ReactNode } from 'react';

import styled from 'styled-components';

import { Toggle } from './CollapsibleHeaderContent';
import { FillType, PaddingType } from './types';
import { mapPaddingTypeToHeaderPadding } from './utils';
import { ElevationUp } from '../ElevationContext/ElevationContext';

type HeaderProps = {
    $paddingType: PaddingType;
    $collapsible: boolean;
};

const Header = styled.header<HeaderProps>`
    padding: ${mapPaddingTypeToHeaderPadding};
    cursor: ${({ $collapsible }) => ($collapsible ? 'pointer' : 'default')};

    &:hover {
        ${Toggle} {
            opacity: ${({ $collapsible }) => ($collapsible ? 0.5 : 1)};
        }
    }
`;

export interface CollapsibleHeaderProps {
    paddingType: PaddingType;
    fillType: FillType;
    children: ReactNode;
    collapsible: boolean;
}

export function CollapsibleHeader({
    paddingType,
    fillType,
    children,
    collapsible,
}: CollapsibleHeaderProps) {
    return (
        <Header $paddingType={paddingType} $collapsible={collapsible}>
            {fillType === 'none' ? children : <ElevationUp>{children}</ElevationUp>}
        </Header>
    );
}
