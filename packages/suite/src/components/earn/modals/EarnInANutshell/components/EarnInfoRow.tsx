import { Badge, BulletList, Paragraph, Row } from '@trezor/components';

interface EarnInfoRowProps {
    heading: React.ReactNode;
    subheading?: React.ReactNode;
    content?: {
        text: React.ReactNode;
        isBadge?: boolean;
    };
    isExpanded?: boolean;
}

export const EarnInfoRow = ({
    heading,
    subheading,
    content,
    isExpanded = false,
}: EarnInfoRowProps) => (
    <BulletList.Item
        title={
            <Row justifyContent="space-between" gap={16}>
                {heading}
                {content &&
                    (content.isBadge ? (
                        <Badge size="small">{content.text}</Badge>
                    ) : (
                        <Paragraph variant="tertiary" typographyStyle="hint" textWrap="nowrap">
                            {content.text}
                        </Paragraph>
                    ))}
            </Row>
        }
    >
        {subheading && isExpanded && (
            <Paragraph variant="tertiary" typographyStyle="hint">
                {subheading}
            </Paragraph>
        )}
    </BulletList.Item>
);
