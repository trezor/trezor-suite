import { Translation } from '@suite/intl';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits, isNftTokenTransfer } from '@suite-common/wallet-utils';
import { type TokenTransfer } from '@trezor/blockchain-link-types';
import { Column, H4 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedNftAmount } from 'src/components/suite/FormattedNftAmount';

import { type IODetailsType } from './IODetailsType';
import { IOGroup } from './IOGroup';

type TokensByStandard = {
    [key: string]: TokenTransfer[];
};

type TokenSpecificBalanceDetailsRowProps = {
    tx: WalletAccountTransaction;
    isPhishingTransaction?: boolean;
};

export const TokenSpecificBalanceDetailsRow = ({
    tx,
    isPhishingTransaction,
}: TokenSpecificBalanceDetailsRowProps) => {
    const tokensByStandard: TokensByStandard = tx.tokens.reduce(
        (acc: TokensByStandard, value: TokenTransfer) => {
            const { standard } = value;

            if (!standard) return acc;

            if (!acc[standard]) {
                acc[standard] = [];
            }

            acc[standard].push(value);

            return acc;
        },
        {},
    );

    return (
        <>
            {tx.internalTransfers?.length ? (
                <Column gap={spacings.xs}>
                    <H4>
                        <Translation id="TR_INTERNAL_TRANSACTIONS" />
                    </H4>
                    {tx.internalTransfers.map(({ from, to, amount }, index) => (
                        <IOGroup
                            key={index}
                            tx={tx}
                            inputs={[{ addresses: [from], value: amount }] as IODetailsType[]}
                            outputs={[{ addresses: [to] }] as IODetailsType[]}
                            hasHeadings={false}
                            isPhishingTransaction={isPhishingTransaction}
                        />
                    ))}
                </Column>
            ) : null}

            {Object.entries(tokensByStandard).map(([key, tokens]) => {
                const getStandardDisplayName = (standard: string) => {
                    switch (standard) {
                        case 'STELLAR-CLASSIC':
                            return 'Stellar';
                        default:
                            return standard.toUpperCase();
                    }
                };

                return (
                    <Column key={key} gap={spacings.xs}>
                        <H4>
                            <Translation
                                id="TR_TOKEN_TRANSFERS"
                                values={{ standard: getStandardDisplayName(key) }}
                            />
                        </H4>
                        {tokens.map((transfer, index) => {
                            const value = isNftTokenTransfer(transfer) ? (
                                <FormattedNftAmount
                                    transfer={transfer}
                                    isWithLink
                                    alignMultitoken="flex-start"
                                    linkTypographyStyle="body-xs"
                                />
                            ) : (
                                convertAmountSubunitsToUnits(transfer.amount, transfer.decimals)
                            );

                            return (
                                <IOGroup
                                    key={index}
                                    tx={{ ...tx, symbol: transfer.symbol || '' }}
                                    contractAddress={transfer.contract}
                                    inputs={
                                        [{ addresses: [transfer.from], value }] as IODetailsType[]
                                    }
                                    outputs={[{ addresses: [transfer.to] }] as IODetailsType[]}
                                    hasHeadings={false}
                                    isPhishingTransaction={isPhishingTransaction}
                                />
                            );
                        })}
                    </Column>
                );
            })}
        </>
    );
};
