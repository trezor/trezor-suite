import styled from 'styled-components';

import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Paragraph, InfoItem, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';

import { Translation } from 'src/components/suite';

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
        verticalAlignment="top"
    >
        <ParagraphWrapper>
            <Paragraph typographyStyle="label">{content}</Paragraph>
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
