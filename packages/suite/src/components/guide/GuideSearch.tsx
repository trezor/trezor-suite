import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon, Input, Loader, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { useTranslation } from '@suite-hooks';
import type { Category } from '@suite-types/guide';
import { GuideNode } from '@guide-components';
import { useGuideSearch } from '@guide-hooks';

const Wrapper = styled.div`
    margin-bottom: 40px;
`;

const PageFoundList = styled.div`
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

const NoResults = styled.p`
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const PreviewContent = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    & > em {
        font-style: inherit;
        color: ${props => props.theme.TYPE_DARK_GREY};
    }
`;

const StyledInput = styled(Input)`
    && {
        background-color: ${props => props.theme.BG_GREY_ALT};
        border: none;
        border-radius: 8px;
        height: 40px;
    }
`;

const Preview = ({ content, from, length }: { content: string; from: number; length: number }) => (
    <PreviewContent>
        {content.substr(0, from)}
        <em>{content.substr(from, length)}</em>
        {content.substr(from + length)}
    </PreviewContent>
);

type GuideSearchProps = {
    pageRoot: Category | null;
    setSearchActive: (active: boolean) => void;
};

const GuideSearch = ({ pageRoot, setSearchActive }: GuideSearchProps) => {
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
                noTopLabel
                placeholder={translationString('TR_SEARCH')}
                noError
                value={query}
                onChange={e => setQuery(e.currentTarget.value)}
                addonAlign="left"
                clearButton
                onClear={() => setQuery('')}
                textIndent={[16, 12]}
                innerAddon={loading ? <Loader size={16} /> : <Icon icon="SEARCH" size={16} />}
            />
            {searchResult.length ? (
                <PageFoundList>
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
                    <NoResults>
                        <Translation id="TR_ACCOUNT_SEARCH_NO_RESULTS" />
                    </NoResults>
                )
            )}
        </Wrapper>
    );
};

export default GuideSearch;
