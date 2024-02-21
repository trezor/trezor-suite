import { ClipboardEvent } from 'react';
import styled from 'styled-components';
import { DeviceDisplayText } from './DeviceDisplayText';
import { splitStringEveryNCharacters } from '@trezor/utils';

const Row = styled.div<{ isAlignedRight?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: ${({ isAlignedRight }) => (isAlignedRight ? 'flex-end' : 'flex-start')};
`;

const ChunksContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

type DisplayChunksProps = {
    isPixelType: boolean;
    'data-test'?: string;
    address: string;
};

const groupByN = <T,>(arr: T[], n: number): T[][] =>
    arr.reduce((result, item, index) => {
        const rowIndex = Math.floor(index / n);

        if (!result[rowIndex]) {
            result[rowIndex] = [];
        }

        result[rowIndex].push(item);

        return result;
    }, [] as T[][]);

export const DisplayChunks = ({
    isPixelType,
    'data-test': dataTest,
    address,
}: DisplayChunksProps) => {
    const showChunksInRows = (chunks: string[][] | undefined, isNextAddress?: boolean) =>
        chunks?.map((row, rowIndex) => (
            <Row key={rowIndex} isAlignedRight={rowIndex === 0 && isNextAddress}>
                {row.map((chunk, chunkIndex) => (
                    <DeviceDisplayText isPixelType={isPixelType} key={chunkIndex} data-test="chunk">
                        {chunk}
                    </DeviceDisplayText>
                ))}
            </Row>
        ));

    const chunks: string[] = splitStringEveryNCharacters(address, 4);
    const groupedChunks = groupByN(chunks, 4);

    const handleOnCopy = (event: ClipboardEvent) => {
        const selectedText = window.getSelection()?.toString();

        if (selectedText) {
            const processedText = selectedText.replace(/\s/g, '');
            event?.nativeEvent?.clipboardData?.setData('text/plain', processedText);
            event.preventDefault();
        }
    };

    return (
        <ChunksContainer onCopy={handleOnCopy} data-test={dataTest}>
            {showChunksInRows(groupedChunks)}
        </ChunksContainer>
    );
};
