import { Network } from '@wallet-types';

type Field = { [key: string]: string };

const CSV_SEPARATOR = ';';
const CSV_NEWLINE = '\n';

export const prepareCsv = (fields: Field, content: any[]) => {
    const lines: string[] = [];

    const fieldKeys = Object.keys(fields);
    const fieldValues = Object.values(fields);

    // Prepare header
    let line: string[] = [];
    fieldValues.forEach(v => {
        line.push(v);
    });

    lines.push(line.join(CSV_SEPARATOR));

    // Prepare data
    content.forEach(c => {
        line = [];

        fieldKeys.forEach(k => {
            line.push(c[k]);
        });

        lines.push(line.join(CSV_SEPARATOR));
    });

    return lines.join(CSV_NEWLINE);
};

export const preparePdf = (fields: Field, content: any[], coin: Network['symbol']) => {
    const fieldKeys = Object.keys(fields);
    const fieldValues = Object.values(fields);
    const lines: any[] = [];
    content.forEach(c => {
        const line: string[] = [];

        fieldKeys.forEach(k => {
            line.push(c[k]);
        });

        lines.push(line);
    });

    return {
        pageOrientation: 'landscape',
        content: [
            {
                text: coin,
                style: 'header',
            },
            {
                style: 'table',
                table: {
                    // widths,
                    body: [fieldValues, ...lines],
                },
            },
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
            },
            table: {
                marginTop: 9,
                fontSize: 8,
            },
        },
    };
};
