import styled from 'styled-components';

export const DeviceDisplayText = styled.div<{ isPixelType: boolean; isWithIndentation?: boolean }>`
    font-family: ${({ isPixelType }) => (isPixelType ? 'PixelOperatorMono8' : 'RobotoMono')},
        monospace;
    font-size: ${({ isPixelType }) => (isPixelType ? '12' : '18')}px;
    color: white;
    word-break: break-word;
    display: inline;
    ${({ isWithIndentation, isPixelType }) =>
        isWithIndentation &&
        `
        text-indent: ${isPixelType ? '36px' : '28px'};
    `}
`;
