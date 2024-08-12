import styled from 'styled-components';
import { DeviceDisplayText } from './DeviceDisplayText';
import { splitStringEveryNCharacters } from '@trezor/utils';
import { handleOnCopy } from 'src/utils/suite/deviceDisplay';

const Row = styled.div<{ $isAlignedRight?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: ${({ $isAlignedRight }) => ($isAlignedRight ? 'flex-end' : 'flex-start')};
`;

const ChunksContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

type DisplayChunksProps = {
    isPixelType: boolean;
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

export const DisplayChunks = ({ isPixelType, address }: DisplayChunksProps) => {
    const showChunksInRows = (chunks: string[][] | undefined, isNextAddress?: boolean) =>
        chunks?.map((row, rowIndex) => (
            <Row key={rowIndex} $isAlignedRight={rowIndex === 0 && isNextAddress}>
                {row.map((chunk, chunkIndex) => (
                    <DeviceDisplayText
                        $isPixelType={isPixelType}
                        key={chunkIndex}
                        data-testid="chunk"
                    >
                        {chunk}
                    </DeviceDisplayText>
                ))}
            </Row>
        ));

    const chunks: string[] = splitStringEveryNCharacters(address, 4);
    const groupedChunks = groupByN(chunks, 4);

    return (
        <ChunksContainer onCopy={handleOnCopy} data-testid="@device-display/chunked-text">
            {showChunksInRows(groupedChunks)}
        </ChunksContainer>
    );
};
