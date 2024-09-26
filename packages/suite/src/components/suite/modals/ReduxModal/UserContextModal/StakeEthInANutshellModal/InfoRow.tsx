import { Badge, Paragraph, Row, List } from '@trezor/components';

interface InfoRowProps {
    label: React.ReactNode;
    content: {
        isBadge?: boolean;
        text: React.ReactNode;
    };
}

export const InfoRow = ({ label, content }: InfoRowProps) => {
    const displayContent = content?.isBadge ? (
        <Badge size="tiny">{content.text}</Badge>
    ) : (
        <Paragraph variant="tertiary" typographyStyle="hint">
            {content.text}
        </Paragraph>
    );

    return (
        <List.Item>
            <Row justifyContent="space-between">
                {label}
                {displayContent}
            </Row>
        </List.Item>
    );
};
