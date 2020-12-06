import { AccountTransaction } from 'trezor-connect';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { formatAmount, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Network } from '@wallet-types';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

type Data = {
    coin: Network['symbol'];
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

const makePdf = (definitions: TDocumentDefinitions): Promise<Blob> =>
    new Promise(resolve => {
        pdfMake.createPdf(definitions).getBlob(blob => {
            resolve(blob);
        });
    });

const prepareContent = (data: Data) => {
    const { coin, type, transactions } = data;
    return transactions.map(t => {
        let addresses = [];
        if (t.tokens.length > 0) {
            addresses = t.tokens.map(token => {
                if (token?.address && token?.amount) {
                    return `${token.address} (${formatAmount(token.amount, token.decimals)} ${
                        token.symbol
                    })`;
                }

                return null;
            });
        } else {
            addresses = t.targets.map(target => {
                if (target?.addresses?.length && target?.amount) {
                    return `${target.addresses[0]} (${formatNetworkAmount(target.amount, coin)})`;
                }

                return null;
            });
        }

        return {
            ...t,
            addresses: addresses.join(addressSeparator[type]),
            type: t.type.toUpperCase(),
            amount: formatNetworkAmount(t.amount, coin),
            fee: formatNetworkAmount(t.fee, coin),
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

const preparePdf = (fields: Field, content: any[], coin: Network['symbol']) => {
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

export const formatData = async (data: Data) => {
    const { coin, type, transactions } = data;
    switch (type) {
        case 'csv': {
            const csv = prepareCsv(fields, prepareContent(data));
            return new Blob([csv], { type: 'text/csv;charset=utf-8' });
        }
        case 'pdf': {
            const pdfLayout = preparePdf(fields, prepareContent(data), coin);
            const pdf = await makePdf(pdfLayout as TDocumentDefinitions);
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
