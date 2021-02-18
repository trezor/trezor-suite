import { AccountTransaction } from 'trezor-connect';
import { Network } from '@wallet-types';
import { trezorLogo } from '@suite-constants/b64images';

import type { TDocumentDefinitions } from 'pdfmake/interfaces';

type Data = {
    coin: Network['symbol'];
    accountName: string;
    type: 'csv' | 'pdf' | 'json';
    transactions: AccountTransaction[];
};

type Field = { [key: string]: string };

const CSV_NEWLINE = '\n';
const CSV_SEPARATOR = ';';

const fields = {
    datetime: 'Date & Time',
    type: 'Type',
    txid: 'Transaction ID',
    addresses: 'Addresses',
    fee: 'Fee',
    amount: 'Total',
};

const addressSeparator = {
    csv: ' | ',
    pdf: '\n',
    json: '',
};

// Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/format
const dateTimeFormat = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
};

const loadPdfMake = async () => {
    const pdfMake = await import(/* webpackChunkName: "pdfMake" */ 'pdfmake/build/pdfmake');
    const pdfFonts = await import(/* webpackChunkName: "pdfFonts" */ 'pdfmake/build/vfs_fonts');
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    return pdfMake;
};

const makePdf = (
    definitions: TDocumentDefinitions,
    pdfMake: typeof import('pdfmake/build/pdfmake'),
): Promise<Blob> =>
    new Promise(resolve => {
        pdfMake.createPdf(definitions).getBlob(blob => {
            resolve(blob);
        });
    });

const prepareContent = (data: Data) => {
    const { type, transactions } = data;
    return transactions.map(t => {
        let addresses = [];
        if (t.tokens.length > 0) {
            addresses = t.tokens.map(token => {
                if (token?.address && token?.amount) {
                    return `${token.address} (${token.amount} ${token.symbol.toUpperCase()})`;
                }

                return null;
            });
        } else {
            addresses = t.targets.map(target => {
                if (target?.addresses?.length && target?.amount) {
                    return `${target.addresses[0]} (${target.amount})`;
                }

                return null;
            });
        }

        return {
            ...t,
            addresses: addresses.join(addressSeparator[type]),
            type: t.type.toUpperCase(),
            datetime: new Intl.DateTimeFormat('default', dateTimeFormat).format(
                (t.blockTime || 0) * 1000,
            ),
        };
    });
};

const prepareCsv = (fields: Field, content: any[]) => {
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

const preparePdf = (
    fields: Field,
    content: any[],
    coin: Network['symbol'],
    accountName: string,
): TDocumentDefinitions => {
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
        header: [
            {
                columns: [
                    {
                        text: `${accountName} (${coin.toUpperCase()})`,
                        fontSize: 18,
                        bold: true,
                        alignment: 'left',
                        margin: [50, 12, 0, 0],
                    },
                    {
                        image: `data:image/png;base64,${trezorLogo}`,
                        width: 140,
                        alignment: 'right',
                        margin: [0, 10, 30, 0],
                    },
                ],
            },
        ],
        footer: (page: number, count: number) => [
            {
                text: `${page} of ${count}`,
                fontSize: 8,
                alignment: 'right',
                margin: [0, 6, 50, 0],
            },
        ],
        content: [
            {
                table: {
                    headerRows: 1,
                    body: [fieldValues, ...lines],
                },
                fontSize: 8,
            },
        ],
    };
};

export const formatData = async (data: Data) => {
    const { coin, accountName, type, transactions } = data;
    switch (type) {
        case 'csv': {
            const csv = prepareCsv(fields, prepareContent(data));
            return new Blob([csv], { type: 'text/csv;charset=utf-8' });
        }
        case 'pdf': {
            const pdfLayout = preparePdf(fields, prepareContent(data), coin, accountName);
            const pdfMake = await loadPdfMake();
            const pdf = await makePdf(pdfLayout, pdfMake);
            return pdf;
        }
        case 'json': {
            const json = JSON.stringify({
                coin,
                transactions,
            });
            return new Blob([json], { type: 'text/json;charset=utf-8' });
        }
        // no default
    }
};
