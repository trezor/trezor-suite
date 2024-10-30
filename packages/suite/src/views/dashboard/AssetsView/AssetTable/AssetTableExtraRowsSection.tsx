import styled, { css } from 'styled-components';
import { borders } from '@trezor/theme';

type DashedLinePosition = 'middleToBottom' | 'topToBottom' | 'topToMiddle';

const mapPositionToTop = (position: DashedLinePosition) => {
    switch (position) {
        case 'middleToBottom':
            return '50%';
        case 'topToBottom':
            return borders.widths.large;
        case 'topToMiddle':
            return borders.widths.large;
    }
};

const mapPositionToBottom = (position: DashedLinePosition) => {
    switch (position) {
        case 'middleToBottom':
            return '0';
        case 'topToBottom':
            return '0';
        case 'topToMiddle':
            return '50%';
    }
};

export const AssetTableExtraRowsSection = styled.div<{
    $dashedLinePosition?: DashedLinePosition;
}>`
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
                border-left: ${borders.widths.large} dotted ${({ theme }) => theme.borderDashed};
                z-index: -1;
            }
        `}
`;
