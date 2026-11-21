import { Translation, type TranslationKey } from '@suite/intl';
import { Badge, Paragraph, Row, StepList } from '@trezor/components';

type EarnInfoRowContent = {
    text: React.ReactNode;
    isBadge?: boolean;
};

interface EarnInfoRowProps {
    heading: React.ReactNode;
    subheading?: React.ReactNode;
    content?: EarnInfoRowContent;
}

type EarnDaysMessageId = Extract<
    TranslationKey,
    'TR_EARN_APPROXIMATE_DAYS' | 'TR_UP_TO_DAYS' | 'TR_STAKE_DAYS'
>;

// A period that is not cached yet omits the row's day count instead of a fallback.
export const getEarnInfoRowDaysContent = (
    days: number | null,
    id: EarnDaysMessageId,
): EarnInfoRowContent | undefined =>
    days === null ? undefined : { text: <Translation id={id} values={{ count: days }} /> };

export const EarnInfoRow = ({ heading, subheading, content }: EarnInfoRowProps) => (
    <StepList.Item
        title={
            <Row justifyContent="space-between" gap={16}>
                {heading}
                {content &&
                    (content.isBadge ? (
                        <Badge size="small" data-testid="@earn/info-row/content">
                            {content.text}
                        </Badge>
                    ) : (
                        <Paragraph
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-sm"
                            textWrap="nowrap"
                            data-testid="@earn/info-row/content"
                        >
                            {content.text}
                        </Paragraph>
                    ))}
            </Row>
        }
    >
        {subheading && (
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                data-testid="@earn/info-row/subheading"
            >
                {subheading}
            </Paragraph>
        )}
    </StepList.Item>
);
