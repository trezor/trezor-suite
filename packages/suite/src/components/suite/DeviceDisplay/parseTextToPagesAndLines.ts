import { DeviceModelInternal } from '@trezor/connect';
import {
    MAX_ROWS_PER_PAGE,
    MAX_CHARACTERS_ON_ROW,
    CHARACTER_OFFSET_FOR_CONTINUES_ARROW,
    CHARACTER_OFFSET_FOR_NEXT_ARROW,
} from '../../../constants/suite/device';

export type ParseTextToLinesParams = {
    deviceModel: DeviceModelInternal;
    text: string;
};

export type ResultRow = { text: string };
export type ResultPage = { rows: ResultRow[] };

export type ParseTextToLinesResult = {
    pages: ResultPage[];
    hasNextIcon: boolean;
};

const getCharsShorter = ({
    isFirstRow,
    isFirstPage,
    isLastRow,
    isLastPage,
    offsetForContinuesArrows,
    offsetForNextArrows,
}: {
    isFirstRow: boolean;
    isFirstPage: boolean;
    isLastRow: boolean;
    isLastPage: boolean;
    offsetForContinuesArrows: number;
    offsetForNextArrows: number;
}): number => {
    const isShorterFirstRow = isFirstRow && !isFirstPage;
    const isShorterLastRow = isLastRow && !isLastPage;

    if (isShorterFirstRow) {
        return offsetForNextArrows;
    }

    if (isShorterLastRow) {
        return offsetForContinuesArrows;
    }

    return 0;
};

export const parseTextToPagesAndLines = ({
    deviceModel,
    text,
}: ParseTextToLinesParams): ParseTextToLinesResult => {
    const rowsPerPage = MAX_ROWS_PER_PAGE[deviceModel];
    const charsPerRow = MAX_CHARACTERS_ON_ROW[deviceModel];
    const offsetForContinuesArrows = CHARACTER_OFFSET_FOR_CONTINUES_ARROW[deviceModel];
    const offsetForNextArrows = CHARACTER_OFFSET_FOR_NEXT_ARROW[deviceModel];

    const charsOnLastPage = rowsPerPage * charsPerRow - offsetForNextArrows;

    let pageIndex = 0;
    let remaining = text;
    let pages: ResultPage[] = [];

    while (remaining.length > 0) {
        const isFirstPage = pageIndex === 0;
        const isLastPage = remaining.length <= charsOnLastPage;

        let rowIndex = 0;
        const rows: ResultRow[] = [];

        while (rowIndex < rowsPerPage) {
            const isFirstRow = rowIndex === 0;
            const isLastRow = rowIndex === rowsPerPage - 1;

            const chars =
                charsPerRow -
                getCharsShorter({
                    isFirstPage,
                    isLastPage,
                    isFirstRow,
                    isLastRow,
                    offsetForContinuesArrows,
                    offsetForNextArrows,
                });

            rows.push({ text: remaining.slice(0, chars) });
            remaining = remaining.slice(chars);

            if (remaining.length === 0) {
                break;
            }

            rowIndex++;
        }

        pages.push({ rows });
        pageIndex++;
    }

    return {
        pages,
        hasNextIcon: offsetForNextArrows > 1,
    };
};
