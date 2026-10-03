import { Fragment, type ReactNode } from 'react';

import styled from 'styled-components';

import { useExternalLink } from '@suite/external-links';
import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol, getExplorerUrl } from '@suite-common/wallet-config';
import { type ExplorerState, selectExplorer } from '@suite-common/wallet-core';
import { InfoItem, Link, Paragraph } from '@trezor/components';
import type {
    StellarAuthorizedCallData,
    StellarContractCallArgument,
    StellarContractCallData,
} from '@trezor/network-stellar/types';

import { useSelector } from 'src/hooks/suite';

const RowContent = styled.div`
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

type CallDataRowProps = {
    translationId: TranslationKey;
    content: ReactNode;
};

const CallDataRow = ({ translationId, content }: CallDataRowProps) => (
    <InfoItem
        label={<Translation id={translationId} />}
        direction="row"
        labelWidth={100}
        verticalAlignment="start"
    >
        <RowContent>
            <Paragraph typographyStyle="body-xs">{content}</Paragraph>
        </RowContent>
    </InfoItem>
);

type ExplorerAddressProps = {
    value: string;
    kind: 'account' | 'contract';
    symbol: NetworkSymbol;
};

const ExplorerAddress = ({ value, kind, symbol }: ExplorerAddressProps) => {
    const explorer = useSelector((state: ExplorerState) => selectExplorer(state, symbol));
    const explorerUrl = getExplorerUrl(explorer, kind === 'contract' ? 'contract' : 'address');
    const href = useExternalLink(`${explorerUrl}${value}${explorer?.queryString ?? ''}`);

    return <Link href={href}>{value}</Link>;
};

// `white-space: pre-wrap` turns the newlines into breaks, which keeps the address links inline.
const joinLines = (lines: ReactNode[]) =>
    lines.map((line, index) => (
        <Fragment key={index}>
            {index > 0 && '\n'}
            {line}
        </Fragment>
    ));

const argumentLine = (
    { kind, value }: StellarContractCallArgument,
    index: number,
    symbol: NetworkSymbol,
    indent: string,
) => (
    <>
        {`${indent}[${index}] `}
        {kind === 'text' ? value : <ExplorerAddress value={value} kind={kind} symbol={symbol} />}
    </>
);

// Two 56-character addresses on one line would overflow the row.
const authorizedCallLines = (
    { contractId, functionName, depth, args }: StellarAuthorizedCallData,
    symbol: NetworkSymbol,
) => {
    const indent = '  '.repeat(depth);

    return [
        <>
            {indent}
            <ExplorerAddress value={contractId} kind="contract" symbol={symbol} />
            {` :: ${functionName}`}
        </>,
        ...args.map((argument, index) => argumentLine(argument, index, symbol, `${indent}  `)),
    ];
};

type StellarContractCallRowsProps = {
    contractCall?: StellarContractCallData;
    symbol: NetworkSymbol;
};

/** The Soroban equivalent of the EVM calldata rows; arguments are positional. */
export const StellarContractCallRows = ({ contractCall, symbol }: StellarContractCallRowsProps) => {
    if (!contractCall) return null;

    const { contractId, functionName, args, authorizedCalls } = contractCall;

    return (
        <>
            <CallDataRow
                translationId="TR_TX_DATA_CONTRACT"
                content={<ExplorerAddress value={contractId} kind="contract" symbol={symbol} />}
            />
            <CallDataRow translationId="TR_TX_DATA_FUNCTION" content={functionName} />
            {args.length > 0 && (
                <CallDataRow
                    translationId="TR_TX_DATA_PARAMS"
                    content={joinLines(
                        args.map((argument, index) => argumentLine(argument, index, symbol, '')),
                    )}
                />
            )}
            {authorizedCalls.length > 0 && (
                <CallDataRow
                    translationId="TR_TX_DATA_AUTHORIZED_CALLS"
                    content={joinLines(
                        authorizedCalls.flatMap(call => authorizedCallLines(call, symbol)),
                    )}
                />
            )}
        </>
    );
};
