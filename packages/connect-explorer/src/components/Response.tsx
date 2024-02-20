import styled from 'styled-components';
import { Inspector } from 'react-inspector';
import type { AppState } from '../types';

import * as methodActions from '../actions/methodActions';
import { useActions } from '../hooks';

// todo: @trezor/utils candidate
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
        padding: 0;
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
    <ClipboardButton title="Copy to clipboard" onClick={_event => copy(props.data)}>
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid">
            <path d="M 5 2 C 3.9 2 3 2.9 3 4 L 3 17 L 5 17 L 5 4 L 15 4 L 15 2 L 5 2 z M 9 6 C 7.9 6 7 6.9 7 8 L 7 20 C 7 21.1 7.9 22 9 22 L 18 22 C 19.1 22 20 21.1 20 20 L 20 8 C 20 6.9 19.1 6 18 6 L 9 6 z M 9 8 L 18 8 L 18 20 L 9 20 L 9 8 z" />
        </svg>
    </ClipboardButton>
);

const Container = styled.div`
    background: #fff;
    flex: 1;
    box-shadow: 0 1px 2px rgb(0 0 0 / 15%);
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
    border-bottom: 0;
    z-index: 2;
    box-shadow: 0 1px 2px rgb(0 0 0 / 15%);
`;

interface ResponseProps {
    tab: AppState['method']['tab'];
    response: AppState['method']['response'];
    code: AppState['method']['javascriptCode'];
    hasDocumentation: boolean;
    docs?: string;
}

const Response = ({ code, docs, hasDocumentation, response, tab }: ResponseProps) => {
    const actions = useActions({
        onTabChange: methodActions.onTabChange,
    });

    const { onTabChange } = actions;

    return (
        <MethodResult tab={tab}>
            <div>
                <MethodResultMenuItem data-tab="response" onClick={() => onTabChange('response')}>
                    Response
                </MethodResultMenuItem>
                <MethodResultMenuItem data-tab="code" onClick={() => onTabChange('code')}>
                    Javascript code
                </MethodResultMenuItem>
                {hasDocumentation && (
                    <MethodResultMenuItem data-tab="docs" onClick={() => onTabChange('docs')}>
                        Documentation
                    </MethodResultMenuItem>
                )}
            </div>
            {(() => {
                switch (tab) {
                    case 'response': {
                        const json = response ? (
                            <Inspector data={response} expandLevel={10} table={false} />
                        ) : null;

                        return (
                            <Container data-test="@response">
                                <CopyToClipboard data={JSON.stringify(response, null, 2)} />
                                {json}
                            </Container>
                        );
                    }

                    case 'code':
                        return (
                            <CodeContainer data-test="@code">
                                <CopyToClipboard data={code} />
                                {code}
                            </CodeContainer>
                        );

                    case 'docs':
                        return (
                            <div data-test="@docs">
                                <Container
                                    className="docs-container"
                                    dangerouslySetInnerHTML={{ __html: docs! }}
                                />
                                ;
                            </div>
                        );

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
