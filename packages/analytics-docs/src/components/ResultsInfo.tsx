import { Link, Paragraph, Row } from '@trezor/components';

type ResultsInfoProps = {
    filteredCount: number;
    totalCount: number;
    platform: string;
    query: string;
    hasActiveFilters?: boolean;
    onClearAll?: () => void;
};

export const ResultsInfo = ({
    filteredCount,
    totalCount,
    platform,
    query,
    hasActiveFilters,
    onClearAll,
}: ResultsInfoProps) => (
    <Row gap={8} alignItems="center" flex="1" overflow="hidden">
        <Paragraph
            typographyStyle="label"
            intent="neutral"
            priority="secondary"
            wordBreak="keep-all"
            textWrap="nowrap"
            ellipsisLineCount={1}
        >
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> events
            {platform !== 'all' ? (
                <>
                    {' '}
                    for platform <strong>{platform}</strong>
                </>
            ) : null}
            {query ? (
                <>
                    {' '}
                    matching <strong>{query.trim()}</strong>
                </>
            ) : null}
            .{' '}
            {hasActiveFilters && onClearAll && (
                <Link onClick={onClearAll} typographyStyle="label">
                    (clear filters)
                </Link>
            )}
        </Paragraph>
    </Row>
);
