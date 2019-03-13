/* @flow */
'use strict';

import React from 'react';
import JSONTree from 'react-json-tree';
import Inspector from 'react-inspector';
import stringifyObject from 'stringify-object';

const JSONTreeTheme = {
    scheme: 'custom',
    base00: '#FFFFFF',
    base01: '#383830',
    base02: '#49483e',
    base03: '#75715e',
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: '#f92672',
    base09: '#fd971f',
    base0A: '#f4bf75',
    base0B: '#a6e22e',
    base0C: '#a1efe4',
    base0D: '#66d9ef',
    base0E: '#ae81ff',
    base0F: '#cc6633'
};
// https://github.com/alexkuz/react-json-tree/blob/master/src/createStylingFromTheme.js

const copy = (data) => {
    const el = document.createElement('textarea');
    el.value = data;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    // showToast();
}

const CopyToClipboard = (props) => {
    return (
        <div className="clipboard-button" title="Copy to clipboard" onClick={ event => copy(props.data) }>
            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid">
                <path d="M 5 2 C 3.9 2 3 2.9 3 4 L 3 17 L 5 17 L 5 4 L 15 4 L 15 2 L 5 2 z M 9 6 C 7.9 6 7 6.9 7 8 L 7 20 C 7 21.1 7.9 22 9 22 L 18 22 C 19.1 22 20 21.1 20 20 L 20 8 C 20 6.9 19.1 6 18 6 L 9 6 z M 9 8 L 18 8 L 18 20 L 9 20 L 9 8 z"/>
            </svg>
        </div>
    )
};

const Response = (props): any => {
    let currentTab = null;
    switch (props.tab) {
        case 'response' :
            const exp = (k, d, l) => {
                return true;
            }
            const json = props.response ? 
                (<Inspector 
                    data={ props.response }
                    expandLevel={10}
                    />
                ) : null;
            currentTab = (
                <div className="response-container">
                    <CopyToClipboard data={ stringifyObject(props.response) } />
                    { json }
                </div>
            );
        break;

        case 'code' :
            currentTab = (
                <pre className="code-container">
                    <CopyToClipboard data={ props.code } />
                    { props.code }
                </pre>
            );
        break;

        case 'docs' :
            currentTab = (
                <div className="docs-container" dangerouslySetInnerHTML={ { __html: props.docs } } />
            );
        break;

        case 'tests' :
            currentTab = (
                <div className="tests-container">
                    TODO
                </div>
            );
        break;
    }

    return (
        <div className={ `method-result ${ props.tab }` }>
            <div className="method-result-menu">
                <div data-tab="response" onClick={ event => props.onTabChange('response') }>Response</div>
                <div data-tab="code" onClick={ event => props.onTabChange('code') }>Javascript code</div>
                {/* <div data-tab="tests" onClick={ event => props.onTabChange('tests') }>Tests</div> */}
                { props.hasDocumentation && (<div data-tab="docs" onClick={ event => props.onTabChange('docs') }>Documentation</div>) }
            </div>
            { currentTab }
        </div>
    );
}

export default Response;