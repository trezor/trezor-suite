import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon, Input, Spinner, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { GuideNode } from 'src/components/guide';
import { useGuideSearch } from 'src/hooks/guide';

import type { GuideCategory } from '@suite-common/suite-types';
import { borders, spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    margin-bottom: ${spacingsPx.xs};
`;

const PageFoundList = styled.div`
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const NoResults = styled.p`
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const PreviewContent = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};

    & > em {
        font-style: inherit;
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }
`;

const StyledInput = styled(Input)`
    input {
        background-color: ${({ theme }) => theme.BG_GREY_ALT};
        border-radius: ${borders.radii.xs};
        border-color: ${({ theme }) => theme.BG_GREY_ALT};
        transition: border-color 0.2s;

        :focus {
            border-color: ${({ theme }) => theme.STROKE_GREY_ALT};
        }
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
        if (setSearchActive) {
            setSearchActive(!!searchResult.length || !!query);
        }
    }, [query, searchResult, setSearchActive, loading]);

    return (
        <Wrapper>
            <StyledInput
                placeholder={translationString('TR_SEARCH')}
                value={query}
                onChange={e => setQuery(e.currentTarget.value)}
                innerAddonAlign="left"
                showClearButton="always"
                onClear={() => setQuery('')}
                innerAddon={loading ? <Spinner size={24} /> : <Icon icon="SEARCH" size={24} />}
                data-test="@guide/search"
            />

            {searchResult.length ? (
                <PageFoundList data-test="@guide/search/results">
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
                    <NoResults data-test="@guide/search/no-results">
                        <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
                    </NoResults>
                )
            )}
        </Wrapper>
    );
};
