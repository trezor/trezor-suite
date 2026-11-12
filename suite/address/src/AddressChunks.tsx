import styled, { css } from 'styled-components';

const CHUNKS_PER_DEVICE_ROW = 4;

type AddressChunkGap = 'none' | 'space' | 'lineBreak';

const AddressChunk = styled.span<{ $gap: AddressChunkGap }>`
    /* The global reset sets a sans font on every element, which would replace the address font. */
    font-family: inherit;

    ${({ $gap }) =>
        $gap === 'space' &&
        css`
            &::after {
                /* Space glyph kept out of the text, so find-in-page can match the address. */
                content: ' ';
            }
        `}
    ${({ $gap }) =>
        $gap === 'lineBreak' &&
        css`
            &::after {
                /* Row break kept out of the text, so find-in-page can match across rows. */
                content: '\\A';
                white-space: pre;
            }
        `}
`;

type AddressChunkGapParams = {
    index: number;
    chunkCount: number;
    isDeviceRendered: boolean;
};

const getAddressChunkGap = ({
    index,
    chunkCount,
    isDeviceRendered,
}: AddressChunkGapParams): AddressChunkGap => {
    const isLastChunk = index === chunkCount - 1;

    if (isLastChunk) {
        return 'none';
    }

    if (isDeviceRendered && (index + 1) % CHUNKS_PER_DEVICE_ROW === 0) {
        return 'lineBreak';
    }

    return 'space';
};

type AddressChunksProps = {
    chunks: string[] | null;
    fallback: string;
    isDeviceRendered: boolean;
};

export const AddressChunks = ({ chunks, fallback, isDeviceRendered }: AddressChunksProps) => {
    if (chunks === null) {
        return fallback;
    }

    return chunks.map((chunk, index) => (
        <AddressChunk
            key={`${index}-${chunk}`}
            $gap={getAddressChunkGap({
                index,
                chunkCount: chunks.length,
                isDeviceRendered,
            })}
        >
            {chunk}
        </AddressChunk>
    ));
};
