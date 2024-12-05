import { Badge, BulletList, Paragraph, Row } from '@trezor/components';

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
            <Row justifyContent="space-between">
                {heading}
                {content &&
                    (content.isBadge ? (
                        <Badge size="tiny">{content.text}</Badge>
                    ) : (
                        <Paragraph variant="tertiary" typographyStyle="hint">
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
