import styled from 'styled-components';
import { DeviceDisplayText } from './DeviceDisplayText';

const TextWrapper = styled.div<{ $isPixelType: boolean }>`
    width: ${({ $isPixelType }) => ($isPixelType ? '10ch' : '20ch')};
    font-family: inherit;
`;

type DisplaySinglePageWrapTextProps = {
    isPixelType: boolean;
    text: string;
};

export const DisplaySinglePageWrapText = ({
    isPixelType,
    text,
}: DisplaySinglePageWrapTextProps) => (
    <DeviceDisplayText $isPixelType={isPixelType} data-test="@device-display/single-page-wrap-text">
        <TextWrapper $isPixelType={isPixelType}>{text}</TextWrapper>
    </DeviceDisplayText>
);
