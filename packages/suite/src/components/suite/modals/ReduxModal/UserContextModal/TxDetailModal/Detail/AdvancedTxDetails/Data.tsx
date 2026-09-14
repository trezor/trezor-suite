import { Fragment, type ReactNode } from 'react';

import styled from 'styled-components';

import { useExternalLink } from '@suite/external-links';
import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    type StellarAuthorizedCallData,
    type StellarContractCallArgument,
} from '@trezor/blockchain-link-types';
import { Column, InfoItem, Link, Paragraph } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
const ParagraphWrapper = styled.div`
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

type DataRowProps = {
    translationId: TranslationKey;
    content: ReactNode;
};

const DataRow = ({ translationId, content }: DataRowProps) => (
    <InfoItem
        label={<Translation id={translationId} />}
        direction="row"
        labelWidth={100}
        verticalAlignment="start"
    >
        <ParagraphWrapper>
            <Paragraph typographyStyle="body-xs">{content}</Paragraph>
        </ParagraphWrapper>
    </InfoItem>
);

type DataProps = {
    tx: WalletAccountTransaction;
};

type ExplorerAddressProps = {
    value: string;
    kind: 'account' | 'contract';
    symbol: NetworkSymbol;
};

const ExplorerAddress = ({ value, kind, symbol }: ExplorerAddressProps) => {
    const explorer = useSelector(state => selectExplorer(state, symbol));
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

// A `transfer` leg's two 56-character addresses would push the call off the end of the row.
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

/**
 * The Soroban equivalent of EVM calldata, decoded from the envelope without a contract ABI — bar
 * the argument *names*, which live in the contract spec, so arguments stay positional. The
 * authorized calls carry their arguments too: Horizon reports balance changes for a Stellar Asset
 * Contract only, so for anything else those nested `transfer` legs are the only record of what
 * moved, between whom, and how much.
 */
const StellarContractCallRows = ({
    contractCall,
    symbol,
}: {
    contractCall: NonNullable<WalletAccountTransaction['stellarSpecific']>['contractCall'];
    symbol: NetworkSymbol;
}) => {
    if (!contractCall) return null;

    const { contractId, functionName, args, authorizedCalls } = contractCall;

    return (
        <>
            <DataRow
                translationId="TR_TX_DATA_CONTRACT"
                content={<ExplorerAddress value={contractId} kind="contract" symbol={symbol} />}
            />
            <DataRow translationId="TR_TX_DATA_FUNCTION" content={functionName} />
            {args.length > 0 && (
                <DataRow
                    translationId="TR_TX_DATA_PARAMS"
                    content={joinLines(
                        args.map((argument, index) => argumentLine(argument, index, symbol, '')),
                    )}
                />
            )}
            {authorizedCalls.length > 0 && (
                <DataRow
                    translationId="TR_TX_DATA_AUTHORIZED_CALLS"
                    content={joinLines(
                        authorizedCalls.flatMap(call => authorizedCallLines(call, symbol)),
                    )}
                />
            )}
        </>
    );
};

export const Data = ({ tx }: DataProps) => {
    const { data, parsedData } = tx.ethereumSpecific || {};
    const { function: fn, methodId, name, params } = parsedData || {};

    return (
        <Column gap={20}>
            {methodId && name && (
                <DataRow translationId="TR_TX_DATA_METHOD_NAME" content={`${name} (${methodId})`} />
            )}
            {methodId && !name && <DataRow translationId="TR_TX_DATA_METHOD" content={methodId} />}
            {fn && <DataRow translationId="TR_TX_DATA_FUNCTION" content={fn} />}
            {params && (
                <DataRow
                    translationId="TR_TX_DATA_PARAMS"
                    content={JSON.stringify(params, undefined, 2)}
                />
            )}
            {data && <DataRow translationId="TR_TX_DATA_INPUT_DATA" content={data} />}
            <StellarContractCallRows
                contractCall={tx.stellarSpecific?.contractCall}
                symbol={tx.symbol}
            />
        </Column>
    );
};
