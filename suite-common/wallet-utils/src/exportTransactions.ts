import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { fromWei } from 'web3-utils';
import { format } from 'date-fns';

import { trezorLogo } from '@suite-common/suite-constants';
import { TransactionTarget } from '@trezor/connect';
import { Network } from '@suite-common/wallet-config';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

import { formatNetworkAmount, formatAmount } from './accountUtils';

type AccountTransactionForExports = Omit<WalletAccountTransaction, 'targets'> & {
    targets: (TransactionTarget & { metadataLabel?: string })[];
};

type FileType = 'csv' | 'pdf' | 'json';

type Data = {
    coin: Network['symbol'];
    accountName: string;
    type: FileType;
    transactions: AccountTransactionForExports[];
    localCurrency: string;
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

// Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/format
const dateFormat = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
} as const;

const timeFormat = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'shortOffset',
} as const;

const formatIfDefined = (amount: string | undefined, symbol: Network['symbol']) =>
    amount ? formatNetworkAmount(amount, symbol) : undefined;

const formatAmounts =
    (symbol: Network['symbol']) =>
    (tx: AccountTransactionForExports): AccountTransactionForExports => ({
        ...tx,
        tokens: tx.tokens.map(token => ({
            ...token,
            amount: formatAmount(token.amount, token.decimals),
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
    const { transactions, coin } = data;
    return transactions
        .map(formatAmounts(coin))
        .flatMap(t => {
            const sharedData = {
                date: new Intl.DateTimeFormat('default', dateFormat).format(
                    (t.blockTime || 0) * 1000,
                ),
                time: new Intl.DateTimeFormat('default', timeFormat).format(
                    (t.blockTime || 0) * 1000,
                ),
                timestamp: t.blockTime?.toString(),
                type: t.type.toUpperCase(),
                txid: t.txid,
            };

        if (t.tokens.length > 0) {
            return t.tokens.map((token, index) => {
                if (token?.address && token?.amount) {
                    return {
                        ...sharedData,
                        fee: index === 0 ? t.fee : '', // fee only once per tx
                        feeSymbol: index === 0 ? coin.toUpperCase() : '',
                        address: token.to, // SENT - it is destination address, RECV - it is MY address
                        label: '', // token transactions do not have labels
                        amount: token.amount, // TODO: what to show if token.decimals missing so amount is not formatted correctly?
                        symbol: token.symbol.toUpperCase() || token.address, // if symbol not available, use contract address
                        fiat: '', // missing rates for tokens
                        other: '',
                    };
                }

                return null;
            });
        }
        return t.targets.map((target, index) => {
            if (target?.addresses?.length && target?.amount) {
                return {
                    ...sharedData,
                    fee: index === 0 ? t.fee : '', // fee only once per tx
                    feeSymbol: index === 0 ? coin.toUpperCase() : '',
                    address: target.isAddress ? target.addresses[0] : '', // SENT - it is destination address, RECV - it is MY address
                    label: target.isAddress && target.metadataLabel ? target.metadataLabel : '',
                    amount: target.isAddress ? target.amount : '',
                    symbol: target.isAddress ? coin.toUpperCase() : '',
                    fiat:
                        target.isAddress && target.amount && t.rates && t.rates[data.localCurrency]
                            ? Intl.NumberFormat(undefined, {
                                  style: 'decimal',
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                              })
                                  .format(parseFloat(target.amount) * t.rates[data.localCurrency]!)
                                  .toString()
                            : '',
                    other: !target.isAddress ? target.addresses[0] : '', // e.g. OP_RETURN
                };
            }

            return null;
        });
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

export const getExportedFileName = (accountName: string, type: FileType) => {
    const accountNameSanitized = accountName
        .slice(0, 240) // limit the file name length
        .replace(/[^a-z0-9]/gi, '_') // replace any special character by _ symbol
        .concat('_') // add one _ at the end as separator from date
        .replace(/_{2,}/g, '_'); // prevent multiple __ in a row

    const currentDateTime = new Date();
    const date = format(currentDateTime, 'yyyyMMdd');
    const time = format(currentDateTime, 'HHmmss');

    return `${accountNameSanitized}${date}T${time}.${type}`;
};
