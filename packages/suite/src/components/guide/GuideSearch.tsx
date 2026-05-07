import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import type { GuideCategory } from '@suite-common/suite-types';
import { Box, Icon, Input, Paragraph, Spinner } from '@trezor/components';
import { typography } from '@trezor/theme';

import { GuideNode } from 'src/components/guide';
import { useGuideSearch } from 'src/hooks/guide';

const PageFoundList = styled.div`
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const PreviewContent = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    ${typography['body-md']}
    color: ${({ theme }) => theme.contentSecondary};

    & > em {
        font-style: inherit;
        color: ${({ theme }) => theme.contentPrimary};
    }
`;

interface PreviewProps {
    content: string;
    from: number;
    length: number;
}

const Preview = ({ content, from, length }: PreviewProps) => (
    <PreviewContent>
        {content.substring(0, from)}
        <em>{content.substring(from, from + length)}</em>
        {content.substring(from + length)}
    </PreviewContent>
);

type GuideSearchProps = {
    pageRoot: GuideCategory | null;
    setSearchActive: (active: boolean) => void;
};

export const GuideSearch = ({ pageRoot, setSearchActive }: GuideSearchProps) => {
    const [query, setQuery] = useState('');

    const { translationString } = useTranslation();
    const { searchResult, loading } = useGuideSearch(query, pageRoot);

    useEffect(() => {
        setSearchActive?.(!!searchResult.length || !!query);
    }, [query, searchResult, setSearchActive, loading]);

    return (
        <Box margin={{ bottom: 8 }}>
            <Input
                placeholder={translationString('TR_SEARCH')}
                value={query}
                onChange={e => setQuery(e.currentTarget.value)}
                showClearButton={true}
                onClear={() => setQuery('')}
                leftContent={
                    loading ? (
                        <Spinner size={24} isDisabled={true} />
                    ) : (
                        <Icon name="magnifyingGlass" size={24} />
                    )
                }
                data-testid="@guide/search"
            />

            {searchResult.length ? (
                <PageFoundList data-testid="@guide/search/results">
                    {searchResult.map(({ page, preview }) => (
                        <GuideNode
                            key={page.id}
                            node={page}
                            description={preview && <Preview {...preview} />}
                        />
                    ))}
                </PageFoundList>
            ) : (
                query &&
                !loading && (
                    <Paragraph
                        data-testid="@guide/search/no-results"
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        margin={{ top: 12 }}
                    >
                        <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
                    </Paragraph>
                )
            )}
        </Box>
    );
};
