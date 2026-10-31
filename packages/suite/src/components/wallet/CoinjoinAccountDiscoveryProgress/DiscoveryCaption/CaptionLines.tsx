import { Translation, type TranslationKey } from '@suite/intl';
import { Paragraph } from '@trezor/components';

type CaptionLinesProps = {
    lead: TranslationKey;
    detail: TranslationKey;
};

export const CaptionLines = ({ lead, detail }: CaptionLinesProps) => (
    <>
        <Paragraph typographyStyle="body-sm-strong" color="contentPrimary" align="center">
            <Translation id={lead} />
        </Paragraph>
        <Paragraph
            typographyStyle="body-sm"
            color="contentSecondary"
            align="center"
            textWrap="balance"
        >
            <Translation id={detail} />
        </Paragraph>
    </>
);
