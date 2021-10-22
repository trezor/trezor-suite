import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import Inspector from 'react-inspector';
import stringifyObject from 'stringify-object';
import type { AppState } from '../types';

import * as methodActions from '../actions/methodActions';
import { useActions } from '../hooks';

const copy = data => {
    const el = document.createElement('textarea');
    el.value = data;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

const ClipboardButton = styled.div`
    cursor: pointer;
    position: absolute;
    top: 50px;
    right: 10px;
    svg {
        padding: 0px;
        width: 20px;
        height: 100%;
        fill: #000;
        transition: fill 0.3s;
    }

    &:hover {
        svg {
            fill: red;
        }
    }
`;

const CopyToClipboard = props => (
    <ClipboardButton title="Copy to clipboard" onClick={event => copy(props.data)}>
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid">
            <path d="M 5 2 C 3.9 2 3 2.9 3 4 L 3 17 L 5 17 L 5 4 L 15 4 L 15 2 L 5 2 z M 9 6 C 7.9 6 7 6.9 7 8 L 7 20 C 7 21.1 7.9 22 9 22 L 18 22 C 19.1 22 20 21.1 20 20 L 20 8 C 20 6.9 19.1 6 18 6 L 9 6 z M 9 8 L 18 8 L 18 20 L 9 20 L 9 8 z" />
        </svg>
    </ClipboardButton>
);

const Container = styled.div`
    background: #fff;
    flex: 1;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    min-height: 400px;
    width: 100%;
    padding: 10px;
    word-wrap: break-word;
    word-break: break-all;

    ul,
    ol {
        list-style: none;
    }
`;

const CodeContainer = styled(Container)`
    white-space: pre;
`;

const MethodResult = styled.div<{ tab: string }>`
    position: relative;
    margin-top: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const MethodResultMenuItem = styled.div`
    display: inline-block;
    padding: 10px 15px;
    cursor: pointer;
    border: 1px solid #eee;
    border-bottom: 0px;
    z-index: 2;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
`;

const DocStyles = createGlobalStyle`
.docs-container {
    word-break: break-word;
    padding: 20px;
    font-size: 14px;
    line-height: 1.5;
    h1, h2, h3, h4 {
        margin: 0;
        font-weight: 600;
        line-height: 1.25;
        margin-bottom: 16px;
        margin-top: 24px;
    }
    h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: .3em;
        margin: 0;
    }
    h3 {
        font-size: 1.25em;
    }
    h4 {
        font-size: 1em;
    }
    p {
        margin: 16px 0px;
    }

    code {
        border-radius: 3px;
        font-size: 85%;
        background-color: rgba(27,31,35,.05);
        padding: .2em .4em;
        &.language-javascript {
            display: block;
            white-space: pre-wrap;
            background-color: #f6f8fa;
            line-height: 1.45;
            overflow: auto;
            padding: 16px;
        }
    }

    ul {
        padding-left: 2em;
        list-style: unset;
        li {
            em {
                font-style: italic;
            }
        }
    }

    a {
        color: #0366d6;
        text-decoration: none;
    }
}
`;
interface Props {
    tab: AppState['method']['tab'];
    response: AppState['method']['response'];
    code: AppState['method']['javascriptCode'];
    hasDocumentation: boolean;
    docs?: string;
}

const Response: React.FC<Props> = props => {
    const actions = useActions({
        onTabChange: methodActions.onTabChange,
    });

    const { onTabChange } = actions;

    return (
        <MethodResult tab={props.tab}>
            <div>
                <MethodResultMenuItem data-tab="response" onClick={() => onTabChange('response')}>
                    Response
                </MethodResultMenuItem>
                <MethodResultMenuItem data-tab="code" onClick={() => onTabChange('code')}>
                    Javascript code
                </MethodResultMenuItem>
                {props.hasDocumentation && (
                    <MethodResultMenuItem data-tab="docs" onClick={() => onTabChange('docs')}>
                        Documentation
                    </MethodResultMenuItem>
                )}
            </div>
            {(() => {
                switch (props.tab) {
                    case 'response': {
                        const json = props.response ? (
                            <Inspector data={props.response} expandLevel={10} />
                        ) : null;
                        return (
                            <Container>
                                <CopyToClipboard data={stringifyObject(props.response)} />
                                {json}
                            </Container>
                        );
                        break;
                    }

                    case 'code':
                        return (
                            <>
                                <CodeContainer>
                                    <CopyToClipboard data={props.code} />
                                    {props.code}
                                </CodeContainer>
                            </>
                        );
                        break;

                    case 'docs':
                        return (
                            <>
                                <DocStyles />
                                <Container
                                    className="docs-container"
                                    dangerouslySetInnerHTML={{ __html: props.docs! }}
                                />
                                ;
                            </>
                        );
                        break;

                    // case 'tests':
                    //     currentTab = <div className="tests-container">TODO</div>;
                    //     break;
                    default:
                        return null;
                }
            })()}
        </MethodResult>
    );
};

export default Response;
