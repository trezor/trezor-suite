import { type ComponentPropsWithRef, type ComponentType } from 'react';

import styled, { css } from 'styled-components';

import { borders } from '@trezor/theme';

type DashedLinePosition = 'middleToBottom' | 'topToBottom' | 'topToMiddle';

const mapPositionToTop = (position: DashedLinePosition) => {
    switch (position) {
        case 'middleToBottom':
            return '50%';
        case 'topToBottom':
        case 'topToMiddle':
            return borders.widths.large;
    }
};

const mapPositionToBottom = (position: DashedLinePosition) => {
    switch (position) {
        case 'middleToBottom':
        case 'topToBottom':
            return '0';
        case 'topToMiddle':
            return '50%';
    }
};

type AssetTableExtraRowsSectionProps = {
    $dashedLinePosition?: DashedLinePosition;
};

export const AssetTableExtraRowsSection: ComponentType<
    ComponentPropsWithRef<'div'> & AssetTableExtraRowsSectionProps
> = styled.div<AssetTableExtraRowsSectionProps>`
    ${({ $dashedLinePosition }) =>
        $dashedLinePosition &&
        css`
            &::before {
                content: '';
                position: absolute;
                top: ${mapPositionToTop($dashedLinePosition)};
                bottom: ${mapPositionToBottom($dashedLinePosition)};
                left: 50%;
                transform: translateX(-50%);
                border-left: ${borders.widths.large} dotted ${({ theme }) => theme.borderNeutral};
                z-index: -1;
            }
        `}
`;
