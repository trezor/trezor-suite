import { Badge, Paragraph, Row, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const ListItem = styled.li<{ $elevation: Elevation }>`
    position: relative;
    padding-left: ${spacingsPx.xl};
    margin-bottom: ${spacingsPx.md};
    list-style-type: none;

    &::before {
        position: absolute;
        content: '';
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: ${spacingsPx.md};
        height: ${spacingsPx.md};
        border-radius: 50%;
        border: ${spacingsPx.xxs} solid ${mapElevationToBorder};
    }

    &:not(:last-child)::after {
        position: absolute;
        content: '';
        left: ${spacings.xs - spacings.xxxs / 2}px;
        top: 100%;
        width: ${spacingsPx.xxxs};
        height: ${spacingsPx.md};
        border-left: ${spacingsPx.xxxs} dashed ${mapElevationToBorder};
    }
`;

interface InfoRowProps {
    label: React.ReactNode;
    content: {
        isBadge?: boolean;
        text: React.ReactNode;
    };
    hasVerticalLine?: boolean;
}

export const InfoRow = ({ label, content }: InfoRowProps) => {
    const { elevation } = useElevation();

    const displayContent = content.isBadge ? (
        <Badge size="tiny">{content.text}</Badge>
    ) : (
        <Paragraph variant="tertiary" typographyStyle="hint">
            {content.text}
        </Paragraph>
    );

    return (
        <ListItem $elevation={elevation}>
            <Row justifyContent="space-between">
                {label}
                {displayContent}
            </Row>
        </ListItem>
    );
};
