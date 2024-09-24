import { Badge, Column, List, Paragraph, Row } from '@trezor/components';
import { Subheading } from './Subheading';
import { RowContent, RowSubheading } from './types';

interface InfoRowProps {
    heading: React.ReactNode;
    subheading: RowSubheading;
    content: RowContent;
    isExpanded?: boolean;
}

export const InfoRow = ({ heading, subheading, content, isExpanded = false }: InfoRowProps) => {
    const displayContent = content.isBadge ? (
        <Badge size="tiny">{content.text}</Badge>
    ) : (
        <Paragraph variant="tertiary" typographyStyle="hint">
            {content.text}
        </Paragraph>
    );

    return (
        <List.Item>
            <Row justifyContent="space-between">
                <Column alignItems="normal">
                    {heading}
                    <Subheading isExpanded={isExpanded} subheading={subheading} />
                </Column>
                {displayContent}
            </Row>
        </List.Item>
    );
};
