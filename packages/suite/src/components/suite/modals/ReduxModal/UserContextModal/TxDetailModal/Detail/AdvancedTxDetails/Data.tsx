import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Column, InfoItem, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

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

export const Data = ({ tx }: DataProps) => {
    const { data, parsedData } = tx.ethereumSpecific || {};
    const { function: fn, methodId, name, params } = parsedData || {};

    return (
        <Column gap={spacings.lg}>
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
        </Column>
    );
};
