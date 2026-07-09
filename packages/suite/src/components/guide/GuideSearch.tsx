import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import type { GuideCategory } from '@suite-common/suite-types';
import { Box, CardList, Icon, Input, Paragraph, Spinner } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';
import { typography } from '@trezor/theme';

import { GuideNode } from 'src/components/guide';
import { MIN_QUERY_LENGTH, useGuideSearch } from 'src/hooks/guide';

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
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { translationString } = useTranslation();
    const { searchResult, loading, isQueryTooShort } = useGuideSearch(query, pageRoot);

    useEffect(() => {
        setSearchActive?.(!!searchResult.length || !!query);
    }, [query, searchResult, setSearchActive, loading]);

    return (
        <Box margin={{ bottom: 16 }}>
            <Input
                placeholder={translationString('TR_SEARCH')}
                value={query}
                size="small"
                onChange={e => setQuery(e.currentTarget.value)}
                showClearButton={true}
                onClear={() => setQuery('')}
                leftContent={
                    loading ? (
                        <Spinner size={24} isDisabled={true} />
                    ) : (
                        <Icon
                            as={MagnifyingGlassIcon}
                            size={20}
                            intent="neutral"
                            priority="secondary"
                            onClick={() => {
                                inputRef?.current?.select();
                            }}
                            cursor="pointer"
                        />
                    )
                }
                data-testid="@guide/search"
                innerRef={inputRef}
            />

            {searchResult.length ? (
                <CardList margin={{ top: 16 }} data-testid="@guide/search/results">
                    {searchResult.map(({ page, preview }) => (
                        <GuideNode
                            key={page.id}
                            node={page}
                            description={preview && <Preview {...preview} />}
                        />
                    ))}
                </CardList>
            ) : (
                query &&
                !loading &&
                (isQueryTooShort ? (
                    <Paragraph
                        data-testid="@guide/search/min-query-length"
                        typographyStyle="body-md"
                        intent="neutral"
                        priority="secondary"
                        margin={{ top: 16 }}
                    >
                        <Translation
                            id="TR_GUIDE_SEARCH_MIN_QUERY_LENGTH"
                            values={{ count: MIN_QUERY_LENGTH }}
                        />
                    </Paragraph>
                ) : (
                    <Paragraph
                        data-testid="@guide/search/no-results"
                        typographyStyle="body-md"
                        intent="neutral"
                        priority="secondary"
                        margin={{ top: 16 }}
                    >
                        <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
                    </Paragraph>
                ))
            )}
        </Box>
    );
};
