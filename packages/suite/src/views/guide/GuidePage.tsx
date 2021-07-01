import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styled, { keyframes } from 'styled-components';

import { useSelector } from '@suite-hooks';
import { variables } from '@trezor/components';
import { Header, Content, ViewWrapper } from '@guide-components';
import { Translation } from '@suite-components';

const DISPLAY_SLOWLY = keyframes`
    from { opacity: 0.0; }
    to { opacity: 1.0; }
`;

const StyledMarkdown = styled.div`
    animation: ${DISPLAY_SLOWLY} 0.5s ease;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    padding: 0 0 32px 0;
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: ${props => props.theme.TYPE_DARK_GREY};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
    h1 {
        margin: 8px 0 16px;
        font-size: ${variables.FONT_SIZE.BIG};
    }
    h2 {
        margin-bottom: 8px 0 12px;
        font-size: ${variables.FONT_SIZE.NORMAL};
    }
    h3,
    h4,
    h5,
    h6 {
        margin: 4px 0 12px;
        font-size: ${variables.FONT_SIZE.SMALL};
    }
    p,
    ul,
    ol {
        margin: 4px 0 12px;
    }
    ul,
    ol {
        padding: 0 0 0 16px;
    }
    li {
        margin: 0 0 8px;
    }
    a {
        color: ${props => props.theme.TYPE_GREEN};
        &:hover {
            text-decoration: underline;
        }
    }
`;

const loadPageMarkdownFile = async (id: string, language = 'en') => {
    const file = await import(`@trezor/suite-data/files/guide/${language}${id}`);
    const md = await file.default;
    return md;
};

const GuidePage = () => {
    const [markdown, setMarkdown] = useState<string>();
    const [hasError, setHasError] = useState<boolean>(false);

    const { currentNode, language } = useSelector(state => ({
        currentNode: state.guide.currentNode,
        language: state.suite.settings.language,
    }));

    useEffect(() => {
        const loadMarkdown = async () => {
            if (currentNode) {
                let md;
                try {
                    md = await loadPageMarkdownFile(currentNode.id, language);
                } catch (e) {
                    console.error(
                        `Loading of ${currentNode.id} page in ${language} language failed: ${e}`,
                    );
                    try {
                        md = await loadPageMarkdownFile(currentNode.id);
                    } catch (e) {
                        console.error(`Loading of ${currentNode.id} page in english failed: ${e}`);
                        setHasError(true);
                        return;
                    }
                }
                setMarkdown(md);
            }
        };
        loadMarkdown();
    }, [currentNode, language]);

    return (
        <ViewWrapper>
            <Header useBreadcrumb />
            <Content>
                {markdown && (
                    <StyledMarkdown>
                        <ReactMarkdown>{markdown}</ReactMarkdown>
                    </StyledMarkdown>
                )}
                {hasError && <Translation id="TR_GENERIC_ERROR_TITLE" />}
            </Content>
        </ViewWrapper>
    );
};

export default GuidePage;
