import styled, { css } from 'styled-components';

type DashedLinePosition = 'middleToBottom' | 'topToBottom' | 'topToMiddle';

const mapPositionToTop = (position: DashedLinePosition) => {
    switch (position) {
        case 'middleToBottom':
            return '50%';
        case 'topToBottom':
        case 'topToMiddle':
            return '2px';
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
                border-left: 2px dotted ${({ theme }) => theme.borderNeutral};
                z-index: -1;
            }
        `}
`;
