import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import * as guideActions from '@suite-actions/guideActions';
import { useActions, useSelector } from '@suite-hooks';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Header, Content, ViewWrapper } from '@guide-components';

const StyledMarkdown = styled.div`
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

const GuideArticle = () => {
    const [markdown, setMarkdown] = useState<string>();
    const { article } = useSelector(state => ({
        article: state.guide.article,
    }));
    const { setView } = useActions({
        setView: guideActions.setView,
        openArticle: guideActions.openArticle,
    });

    useEffect(() => {
        const loadMarkdown = async () => {
            const file = await import(
                `@trezor/suite-data/files/guide-temp/en/trezor-suite/${article}.md`
            );
            const md = await file.default;
            setMarkdown(md);
        };
        loadMarkdown();
    }, [article]);

    return (
        <ViewWrapper>
            <Header back={() => setView('GUIDE_DEFAULT')} />
            <Content>
                {markdown && (
                    <StyledMarkdown>
                        <ReactMarkdown>{markdown}</ReactMarkdown>
                    </StyledMarkdown>
                )}
            </Content>
        </ViewWrapper>
    );
};

export default GuideArticle;
