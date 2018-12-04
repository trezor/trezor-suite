/* @flow */
'use strict';

import React from 'react';
import JSONTree from 'react-json-tree';

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

const Response = (props): any => {
    let currentTab = null;
    switch (props.tab) {
        case 'response' :
            const exp = (k, d, l) => {
                return true;
            }
            const json = props.response ? 
                (<JSONTree 
                    data={ props.response } 
                    hideRoot={ true } 
                    theme={ JSONTreeTheme } 
                    invertTheme={ false }
                    shouldExpandNode={ () => true }
                    />
                ) : null;
            currentTab = (
                <div className="response-container">
                    { json }
                </div>
            );
        break;

        case 'raw' :
            currentTab = (
                <pre className="raw-container">
                    {props.response? JSON.stringify(props.response): null}
                </pre>
            );
        break;

        case 'code' :
            currentTab = (
                <pre className="code-container" dangerouslySetInnerHTML={{__html: props.code }}>
                </pre>
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
                <div data-tab="raw" onClick={ event => props.onTabChange('raw') }>Raw response</div>
                <div data-tab="code" onClick={ event => props.onTabChange('code') }>Javascript code</div>
                {/* <div data-tab="tests" onClick={ event => props.onTabChange('tests') }>Tests</div> */}
            </div>
            { currentTab }
        </div>
    );
}

export default Response;