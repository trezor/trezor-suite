import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { type StellarAuthorizedCallData } from '@trezor/blockchain-link-types';
import { Column, InfoItem, Paragraph } from '@trezor/components';
const ParagraphWrapper = styled.div`
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

type DataRowProps = {
    translationId: TranslationKey;
    content: string;
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

// Arguments go on their own lines rather than inline: a `transfer` leg carries two 56-character
// addresses, which would push the call itself off the end of the row.
const formatAuthorizedCall = ({
    contractId,
    functionName,
    depth,
    args,
}: StellarAuthorizedCallData) => {
    const indent = '  '.repeat(depth);
    const header = `${indent}${contractId} :: ${functionName}`;
    const argLines = args.map(({ value }, index) => `${indent}  [${index}] ${value}`);

    return [header, ...argLines].join('\n');
};

/**
 * The Soroban equivalent of EVM calldata. XDR is self-describing, so the contract, the function
 * and the argument types are decoded from the envelope without a contract ABI — but the argument
 * *names* are not in there, they come from the contract spec, so arguments stay positional.
 *
 * The authorized calls carry their arguments too. That is what makes a swap readable: Horizon
 * reports balance changes only for a Stellar Asset Contract, so for anything else the nested
 * `transfer` legs are the only record of which token moved, between whom, and how much.
 */
const StellarContractCallRows = ({
    contractCall,
}: {
    contractCall: NonNullable<WalletAccountTransaction['stellarSpecific']>['contractCall'];
}) => {
    if (!contractCall) return null;

    const { contractId, functionName, args, authorizedCalls } = contractCall;

    return (
        <>
            <DataRow translationId="TR_TX_DATA_CONTRACT" content={contractId} />
            <DataRow translationId="TR_TX_DATA_FUNCTION" content={functionName} />
            {args.length > 0 && (
                <DataRow
                    translationId="TR_TX_DATA_PARAMS"
                    content={args.map(({ value }, index) => `[${index}] ${value}`).join('\n')}
                />
            )}
            {authorizedCalls.length > 0 && (
                <DataRow
                    translationId="TR_TX_DATA_AUTHORIZED_CALLS"
                    content={authorizedCalls.map(formatAuthorizedCall).join('\n')}
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
            <StellarContractCallRows contractCall={tx.stellarSpecific?.contractCall} />
        </Column>
    );
};
