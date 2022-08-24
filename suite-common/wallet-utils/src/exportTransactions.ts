import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { fromWei } from 'web3-utils';

import { trezorLogo } from '@suite-common/suite-constants';
import { AccountTransaction, TransactionTarget } from '@trezor/connect';
import { Network } from '@suite-common/wallet-config';

import { formatNetworkAmount, formatAmount } from './accountUtils';

type AccountTransactionForExports = Omit<AccountTransaction, 'targets'> & {
    targets: (TransactionTarget & { metadataLabel?: string })[];
};

type Data = {
    coin: Network['symbol'];
    accountName: string;
    type: 'csv' | 'pdf' | 'json';
    transactions: AccountTransactionForExports[];
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
} as const;

const formatIfDefined = (amount: string | undefined, symbol: Network['symbol']) =>
    amount ? formatNetworkAmount(amount, symbol) : undefined;

const formatAmounts =
    (symbol: Network['symbol']) =>
    (tx: AccountTransactionForExports): AccountTransactionForExports => ({
        ...tx,
        tokens: tx.tokens.map(tok => ({
            ...tok,
            amount: formatAmount(tok.amount, tok.decimals),
        })),
        amount: formatNetworkAmount(tx.amount, symbol),
        fee: formatNetworkAmount(tx.fee, symbol),
        totalSpent: formatNetworkAmount(tx.totalSpent, symbol),
        targets: tx.targets.map(tr => ({
            ...tr,
            amount: formatIfDefined(tr.amount, symbol),
        })),
        details: {
            ...tx.details,
            vin: tx.details.vin.map(v => ({
                ...v,
                value: formatIfDefined(v.value, symbol),
            })),
            vout: tx.details.vout.map(v => ({
                ...v,
                value: formatIfDefined(v.value, symbol),
            })),
            totalInput: formatNetworkAmount(tx.details.totalInput, symbol),
            totalOutput: formatNetworkAmount(tx.details.totalOutput, symbol),
        },
        ethereumSpecific: tx.ethereumSpecific
            ? {
                  ...tx.ethereumSpecific,
                  gasPrice: fromWei(tx.ethereumSpecific.gasPrice, 'gwei'),
              }
            : undefined,
        cardanoSpecific: tx.cardanoSpecific
            ? {
                  ...tx.cardanoSpecific,
                  withdrawal: formatIfDefined(tx.cardanoSpecific.withdrawal, symbol),
                  deposit: formatIfDefined(tx.cardanoSpecific.deposit, symbol),
              }
            : undefined,
    });

const loadPdfMake = async () => {
    const pdfMake = (await import(/* webpackChunkName: "pdfMake" */ 'pdfmake/build/pdfmake'))
        .default;
    const fonts = (await import(/* webpackChunkName: "pdfFonts" */ 'pdfmake/build/vfs_fonts'))
        .default;
    if (fonts?.pdfMake?.vfs) {
        pdfMake.vfs = fonts.pdfMake.vfs;
    }
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
    const { type, transactions, coin } = data;
    return transactions.map(formatAmounts(coin)).map(t => {
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
                    return `${target.addresses[0]} (${target.amount}) ${
                        target.metadataLabel ? `- ${target.metadataLabel}` : ''
                    }`;
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
                transactions: transactions.map(formatAmounts(coin)),
            });
            return new Blob([json], { type: 'text/json;charset=utf-8' });
        }
        // no default
    }
};
