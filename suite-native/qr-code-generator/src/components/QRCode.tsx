// A `qr.js` doesn't handle error level of zero (M) so we need to do it right, thus the deep require.
import React, { memo, useMemo } from 'react';

import QRCodeAPI from 'qrcode';

import { QRCodeCell } from './QRCodeCell';
import { QRCodeSurface } from './QRCodeSurface';

// TODO
// const propTypes = {
//     bgColor: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
//     fgColor: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
//     level: PropTypes.string,
//     size: PropTypes.number,
//     value: PropTypes.string.isRequired,
// };

const qrDataToChunks = (inputArray: Uint8Array, chunkSize: number) => {
    const result = inputArray.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / chunkSize);

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
        }

        resultArray[chunkIndex].push(item as 1 | 2);

        return resultArray;
    }, [] as Array<Array<1 | 2>>);

    return result;
};

export const QRCode = memo(
    ({
        bgColor = '#FFFFFF',
        fgColor = '#000000',
        level = 'L',
        size = 256,
        value,
        ...props
    }: any) => {
        const { modules } = useMemo(
            () => QRCodeAPI.create(value, { errorCorrectionLevel: level }),
            [value, level],
        );
        const cells = useMemo(() => qrDataToChunks(modules.data, modules.size), [modules]);
        const tileSize = size / cells.length;
        return (
            <QRCodeSurface {...props} size={size}>
                {cells.map((row, rowIndex) =>
                    row.map((cell, cellIndex) => {
                        const transformX = Math.round(cellIndex * tileSize);
                        const transformY = Math.round(rowIndex * tileSize);
                        const qrItemWidth = Math.round((cellIndex + 1) * tileSize) - transformX;
                        const qrItemHeight = Math.round((rowIndex + 1) * tileSize) - transformY;
                        return (
                            <QRCodeCell
                                /* eslint-disable react/no-array-index-key */
                                key={`rectangle-${rowIndex}-${cellIndex}`}
                                /* eslint-enable react/no-array-index-key */
                                d={`M 0 0 L ${qrItemWidth} 0 L ${qrItemWidth} ${qrItemHeight} L 0 ${qrItemHeight} Z`}
                                fill={cell ? fgColor : bgColor}
                                transformX={transformX}
                                transformY={transformY}
                            />
                        );
                    }),
                )}
            </QRCodeSurface>
        );
    },
);
