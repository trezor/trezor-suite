import { Badge, Paragraph, Row, StepList } from '@trezor/components';

interface EarnInfoRowProps {
    heading: React.ReactNode;
    subheading?: React.ReactNode;
    content?: {
        text: React.ReactNode;
        isBadge?: boolean;
    };
}

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
