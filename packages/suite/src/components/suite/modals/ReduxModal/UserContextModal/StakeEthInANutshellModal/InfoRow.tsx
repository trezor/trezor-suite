import { Badge, Paragraph, Row } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const Circle = styled.span`
    width: ${spacingsPx.md};
    height: ${spacingsPx.md};
    border-radius: 50%;
    border-width: ${spacingsPx.xxs};
    border: ${({ theme }) => `${spacingsPx.xxs} solid ${theme.borderElevation1}`};
`;

const VerticalLine = styled.div`
    height: ${spacingsPx.md};
    width: ${spacingsPx.xxxs};
    border-left: ${spacingsPx.xxxs} dashed ${({ theme }) => theme.borderElevation1};
    margin-left: calc(${spacingsPx.md} / 2 - ${spacingsPx.xxxs} / 2);
`;

interface InfoRowProps {
    label: React.ReactNode;
    content: {
        isBadge?: boolean;
        text: React.ReactNode;
    };
    hasVerticalLine?: boolean;
}

export const InfoRow = ({ label, content, hasVerticalLine = true }: InfoRowProps) => {
    const displayContent = content.isBadge ? (
        <Badge size="tiny">{content.text}</Badge>
    ) : (
        <Paragraph variant="tertiary" typographyStyle="hint">
            {content.text}
        </Paragraph>
    );

    return (
        <>
            <Row justifyContent="space-between">
                <Row gap={spacings.xs}>
                    <Circle />
                    {label}
                </Row>
                {displayContent}
            </Row>
            {hasVerticalLine && <VerticalLine />}
        </>
    );
};
