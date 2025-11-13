import { Badge, BulletList, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface InfoRowProps {
    heading: React.ReactNode;
    subheading?: React.ReactNode;
    content?: {
        text: React.ReactNode;
        isBadge?: boolean;
    };
    isExpanded?: boolean;
}

export const InfoRow = ({ heading, subheading, content, isExpanded = false }: InfoRowProps) => (
    <BulletList.Item
        title={
            <Row justifyContent="space-between" gap={spacings.md}>
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
