import { format } from 'date-fns';
import type PdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { fromWei } from 'web3-utils';

import { trezorLogo } from '@suite-common/suite-constants';
import { type TokenDefinitions, isPhishingTransaction } from '@suite-common/token-definitions';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type ExportFileType,
    type RatesByTimestamps,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    formatNetworkAmount,
    getFiatRateKey,
    getNftTokenId,
    isNftTokenTransfer,
    localizeNumber,
    roundTimestampToNearestPastHour,
    subtypeToStakeTypeMap,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type TransactionTarget } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

type AccountTransactionForExports = Omit<WalletAccountTransaction, 'targets'> & {
    targets: (TransactionTarget & { metadataLabel?: string })[];
};

type Data = {
    symbol: NetworkSymbol;
    accountName: string;
    type: ExportFileType;
    transactions: AccountTransactionForExports[];
    baseCurrencyCode: BaseCurrencyCode;
};

type Fields = {
    [key: string]: string;
    timestamp: string;
    date: string;
    time: string;
    type: string;
    txid: string;
    fee: string;
    feeSymbol: string;
    address: string;
    label: string;
    amount: string;
    symbol: string;
    fiat: string;
    other: string;
};

const CSV_NEWLINE = '\n';
const CSV_SEPARATOR = ',';

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

const formatIfDefined = (amount: string | undefined, symbol: NetworkSymbol) =>
    amount ? formatNetworkAmount(amount, symbol) : undefined;

const formatAmounts =
    (symbol: NetworkSymbol) =>
    (tx: AccountTransactionForExports): AccountTransactionForExports => ({
        ...tx,
        tokens: tx.tokens.map(token => ({
            ...token,
            amount: isNftTokenTransfer(token)
                ? `ID ${getNftTokenId(token)}`
                : convertAmountSubunitsToUnits(token.amount, token.decimals),
        })),
        internalTransfers: tx.internalTransfers.map(internal => ({
            ...internal,
            amount: formatNetworkAmount(internal.amount, symbol),
        })),
        amount: formatNetworkAmount(tx.amount, symbol),
        fee: formatNetworkAmount(tx.fee, symbol),
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
                  gasPrice: fromWei(tx.ethereumSpecific?.gasPrice ?? '0', 'gwei'),
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
    const vfs = (await import(/* webpackChunkName: "pdfFonts" */ 'pdfmake/build/vfs_fonts'))
        .default;
    if (vfs) {
        pdfMake.addVirtualFileSystem(vfs);
    }

    return pdfMake;
};

const makePdf = (definitions: TDocumentDefinitions, pdfMake: typeof PdfMake): Promise<Blob> =>
    pdfMake.createPdf(definitions).getBlob();

const prepareContent = (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
): Fields[] => {
    const { transactions, symbol, baseCurrencyCode } = data;

    return transactions
        .filter(
            t =>
                !isPhishingTransaction({
                    transaction: t,
                    tokenDefinitions,
                    historicRates: historicFiatRates,
                    txsMarkedAsNotScam,
                }).isPhishing,
        )
        .map(formatAmounts(symbol))
        .flatMap(t => {
            const sharedData = {
                date: new Intl.DateTimeFormat('default', dateFormat).format(
                    (t.blockTime || 0) * 1000,
                ),
                time: new Intl.DateTimeFormat('default', timeFormat).format(
                    (t.blockTime || 0) * 1000,
                ),
                timestamp: t.blockTime?.toString() || '',
                type: t.type.toUpperCase(),
                txid: t.txid,
            };
            const symbol = getNetworkDisplaySymbol(data.symbol);
            const fiatRateKey = getFiatRateKey(t.symbol, baseCurrencyCode);
            const roundedTimestamp = roundTimestampToNearestPastHour(t.blockTime as Timestamp);
            const historicRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

            let hasFeeBeenAlreadyUsed = t.type === 'recv'; // TODO: use similar logic as in TransactionItem
            let tokens: Array<Fields | null> = [];
            let internalTransfers: Array<Fields | null> = [];
            let targets: Array<Fields | null> = [];
            let cardanoStaking: Array<Fields | null> = [];

            const getFiatAmount = (amount?: string, historicRate?: number) =>
                amount && historicRate
                    ? localizeNumber(
                          new BigNumber(amount).multipliedBy(historicRate).toNumber(),
                          undefined,
                          2,
                          2,
                      ).toString()
                    : '';

            if (t.targets.length > 0) {
                targets = t.targets.map(target => {
                    if (!target?.addresses?.length || !target?.amount) {
                        return null;
                    }
                    const targetData = {
                        ...sharedData,
                        fee: !hasFeeBeenAlreadyUsed ? t.fee : '', // fee only once per tx
                        feeSymbol: !hasFeeBeenAlreadyUsed ? symbol : '',
                        address: target.isAddress ? target.addresses[0] : '', // SENT - it is destination address, RECV - it is MY address
                        label: target.isAddress && target.metadataLabel ? target.metadataLabel : '',
                        amount: target.isAddress ? target.amount : '',
                        symbol: target.isAddress ? symbol : '',
                        fiat: target.isAddress ? getFiatAmount(target.amount, historicRate) : '',
                        other: !target.isAddress ? target.addresses[0] : '', // e.g. OP_RETURN
                    };
                    hasFeeBeenAlreadyUsed = true;

                    return targetData;
                });
            }

            if (t.tokens.length > 0) {
                tokens = t.tokens.map(token => {
                    if (!token?.contract || !token?.amount) {
                        return null;
                    }

                    const tokenFiatRateKey = getFiatRateKey(
                        t.symbol,
                        baseCurrencyCode,
                        token.contract as TokenAddress,
                    );
                    const historicTokenRate =
                        historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

                    const tokenData = {
                        ...sharedData,
                        fee: !hasFeeBeenAlreadyUsed ? t.fee : '', // fee only once per tx
                        feeSymbol: !hasFeeBeenAlreadyUsed ? symbol : '',
                        address: token.to || '', // SENT - it is destination address, RECV - it is MY address
                        label: '', // token transactions do not have labels
                        amount: token.amount, // TODO: what to show if token.decimals missing so amount is not formatted correctly?
                        symbol: token.symbol || token.contract, // if symbol not available, use contract address
                        fiat: getFiatAmount(token.amount, historicTokenRate),
                        other: '',
                    };
                    hasFeeBeenAlreadyUsed = true;

                    return tokenData;
                });
            }

            if (t.internalTransfers.length > 0) {
                internalTransfers = t.internalTransfers.map(internal => {
                    const internalTransferData = {
                        ...sharedData,
                        fee: !hasFeeBeenAlreadyUsed ? t.fee : '', // fee only once per tx
                        feeSymbol: !hasFeeBeenAlreadyUsed ? symbol : '',
                        address: internal.to || '', // SENT - it is destination address, RECV - it is MY address
                        label: '', // internal transactions do not have labels
                        amount: internal.amount,
                        symbol, // if symbol not available, use contract address
                        fiat: getFiatAmount(internal.amount, historicRate),
                        other: '',
                    };
                    hasFeeBeenAlreadyUsed = true;

                    return internalTransferData;
                });
            }

            if (t.cardanoSpecific && t.cardanoSpecific.subtype) {
                const { subtype, withdrawal = '0', deposit = '0' } = t.cardanoSpecific;

                const amount = (() => {
                    switch (subtype) {
                        case 'withdrawal':
                            return withdrawal;
                        case 'stake_registration':
                        case 'stake_deregistration':
                        case 'stake_delegation':
                            return deposit;
                        default:
                            return '0';
                    }
                })();

                const stakeTypeLabel = (() => {
                    switch (subtypeToStakeTypeMap[subtype]) {
                        case 'stake':
                            return 'Stake';
                        case 'unstake':
                            return 'Unstake';
                        case 'claim':
                            return 'Claim rewards';
                        case 'change-delegate':
                            return 'Change delegate';
                        default:
                            return '';
                    }
                })();

                cardanoStaking = [
                    {
                        ...sharedData,
                        symbol,
                        amount,
                        fee: !hasFeeBeenAlreadyUsed ? t.fee : '',
                        feeSymbol: !hasFeeBeenAlreadyUsed ? symbol : '',
                        address: stakeTypeLabel,
                        label: '',
                        fiat: getFiatAmount(amount, historicRate),
                        other: '',
                    },
                ];

                hasFeeBeenAlreadyUsed = true;
            }

            return [...targets, ...tokens, ...internalTransfers, ...cardanoStaking];
        })
        .filter(record => record !== null) as Fields[];
};

export const sanitizeCsvValue = (value: string) => {
    if (value.indexOf(CSV_SEPARATOR) !== -1) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
};

const prepareCsv = (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
) => {
    const csvFields: Fields = {
        timestamp: 'Timestamp',
        date: 'Date',
        time: 'Time',
        type: 'Type',
        txid: 'Transaction ID',
        fee: 'Fee',
        feeSymbol: 'Fee unit',
        address: 'Address',
        label: 'Label',
        amount: 'Amount',
        symbol: 'Amount unit',
        fiat: `Fiat (${data.baseCurrencyCode.toUpperCase()})`,
        other: 'Other',
    };

    const content = prepareContent(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

    const lines: string[] = [];

    const fieldKeys = Object.keys(csvFields);
    const fieldValues = Object.values(csvFields);

    // Prepare header
    let line: string[] = [];
    fieldValues.forEach(v => {
        line.push(v);
    });

    lines.push(line.join(CSV_SEPARATOR));

    // Prepare data
    content.forEach(item => {
        line = [];

        fieldKeys.forEach(field => {
            line.push(sanitizeCsvValue(item[field]));
        });

        lines.push(line.join(CSV_SEPARATOR));
    });

    return lines.join(CSV_NEWLINE);
};

const preparePdf = (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
): TDocumentDefinitions => {
    const pdfFields = {
        dateTime: 'Date & Time',
        type: 'Type',
        txid: 'Transaction ID',
        feeWithSymbol: `Fee`,
        addressWithLabel: 'Address',
        amountWithSymbol: 'Amount',
    };

    const fieldKeys = Object.keys(pdfFields);
    const fieldValues = Object.values(pdfFields);

    const content = prepareContent(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

    const lines: any[] = [];
    content.forEach(item => {
        const line: string[] = [];

        fieldKeys.forEach(field => {
            const record = item[field];
            if (record) {
                line.push(record);
            }

            switch (field) {
                case 'dateTime':
                    line.push(`${item.date}, ${item.time}`);
                    break;
                case 'feeWithSymbol':
                    line.push(`${item.fee} ${item.feeSymbol}`);
                    break;
                case 'addressWithLabel':
                    line.push(
                        `${item.address}${item.label ? ` - ${item.label}` : ''}${
                            item.other ? ` ${item.other}` : ''
                        }`,
                    );
                    break;
                case 'amountWithSymbol':
                    line.push(`${item.amount} ${item.symbol}`);
                    break;
                // no default
            }
        });

        lines.push(line);
    });

    return {
        pageOrientation: 'landscape',
        header: [
            {
                columns: [
                    {
                        text: `${data.accountName} (${data.symbol.toUpperCase()})`,
                        fontSize: 18,
                        bold: true,
                        alignment: 'left',
                        margin: [39, 12, 0, 0],
                    },
                    {
                        image: `data:image/png;base64,${trezorLogo}`,
                        width: 140,
                        alignment: 'right',
                        margin: [0, 10, 25, 0],
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
                    widths: [45, 30, 290, 65, 203, 65],
                    headerRows: 1,
                    body: [fieldValues, ...lines],
                },
                fontSize: 8,
            },
        ],
    };
};

export const formatData = async (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
) => {
    const { symbol, type, transactions } = data;

    switch (type) {
        case 'csv': {
            const csv = prepareCsv(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

            return new Blob([csv], { type: 'text/csv;charset=utf-8' });
        }
        case 'pdf': {
            const pdfLayout = preparePdf(
                data,
                tokenDefinitions,
                txsMarkedAsNotScam,
                historicFiatRates,
            );
            const pdfMake = await loadPdfMake();
            const pdf = await makePdf(pdfLayout, pdfMake);

            return pdf;
        }
        case 'json': {
            const json = JSON.stringify(
                {
                    coin: symbol,
                    transactions: transactions.map(formatAmounts(symbol)),
                },
                null,
                2,
            );

            return new Blob([json], { type: 'text/json;charset=utf-8' });
        }
        // no default
    }
};

export const getExportedFileName = (accountName: string, type: ExportFileType) => {
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
