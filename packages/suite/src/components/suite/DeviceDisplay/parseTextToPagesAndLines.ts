import { DeviceModelInternal } from '@trezor/connect';
import {
    MAX_CHARACTERS_ON_SCREEN,
    MAX_CHARACTERS_ON_ROW,
    CHARACTER_OFFSET_FOR_ARROW,
} from '../../../constants/suite/device';
import { splitStringEveryNCharacters } from '@trezor/utils';

export type ParseTextToLinesParams = {
    device: DeviceModelInternal;
    text: string;
};

type ResultRow = { text: string };
type ResultPage = { rows: ResultRow[] };

export type ParseTextToLinesResult = {
    pages: ResultPage[];
};

export const parseTextToPagesAndLines = ({
    device,
    text,
}: ParseTextToLinesParams): ParseTextToLinesResult => {
    const charsPerPage = MAX_CHARACTERS_ON_SCREEN[device];
    const charsPerRow = MAX_CHARACTERS_ON_ROW[device];
    const offsetForArrows = CHARACTER_OFFSET_FOR_ARROW[device];

    const pages = splitStringEveryNCharacters(text, charsPerPage);

    const resultPages: ResultPage[] = [];

    for (let i = 0; i < pages.length; i++) {
        const isFirstPage = i === 0;
        const pageText = pages[i];

        const breakpointFirstLine = charsPerRow - (isFirstPage ? 0 : offsetForArrows);

        const firstRow = pageText.slice(0, breakpointFirstLine);
        const remainingRows = splitStringEveryNCharacters(
            pageText.slice(breakpointFirstLine),
            charsPerRow,
        );

        resultPages.push({ rows: [firstRow, ...remainingRows].map(row => ({ text: row })) });
    }

    return { pages: resultPages };
};
