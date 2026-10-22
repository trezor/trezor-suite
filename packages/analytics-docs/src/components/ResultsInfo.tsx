import styled from 'styled-components';

import { Link, Paragraph, Row } from '@trezor/components';

const ResetFiltersLink = styled.span`
    flex-shrink: 0;

    a {
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
`;

type ResultsInfoProps = {
    filteredCount: number;
    totalCount: number;
    hasActiveFilters?: boolean;
    onClearAll?: () => void;
};

export const ResultsInfo = ({
    filteredCount,
    totalCount,
    hasActiveFilters,
    onClearAll,
}: ResultsInfoProps) => (
    <Row gap={8} alignItems="center" flex="1" minWidth={200} overflow="hidden">
        <Paragraph
            typographyStyle="body-xs"
            intent="neutral"
            priority="secondary"
            wordBreak="keep-all"
            textWrap="nowrap"
            ellipsisLineCount={1}
            flex="1"
            minWidth={0}
        >
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> events.
        </Paragraph>
        {hasActiveFilters && onClearAll && (
            <ResetFiltersLink>
                <Link onClick={onClearAll} typographyStyle="body-xs">
                    reset filters
                </Link>
            </ResetFiltersLink>
        )}
    </Row>
);
