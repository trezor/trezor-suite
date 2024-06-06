import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Paragraph, Row } from '@trezor/components';
import { palette, spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';

const Container = styled.div`
    display: grid;
    grid-template-columns: 130px 3fr;
    gap: ${spacingsPx.md};
    margin-top: ${spacingsPx.xxl};
`;

const ParagraphWrapper = styled.div`
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

interface DataRowProps {
    translationId: TranslationKey;
    content: string;
}

const DataRow = ({ translationId, content }: DataRowProps) => (
    <>
        <Row alignItems="flex-start">
            <Paragraph typographyStyle="callout" color={palette.lightGray700}>
                <Translation id={translationId} />
            </Paragraph>
        </Row>
        <Row>
            <ParagraphWrapper>
                <Paragraph typographyStyle="hint">{content}</Paragraph>
            </ParagraphWrapper>
        </Row>
    </>
);

interface DataProps {
    tx: WalletAccountTransaction;
}

export const Data = ({ tx }: DataProps) => {
    const { data, parsedData } = tx.ethereumSpecific || {};
    const { function: fn, methodId, name, params } = parsedData || {};

    return (
        <Container>
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
        </Container>
    );
};
