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

    const json = props.response ? (<JSONTree data={ props.response } theme={ JSONTreeTheme } invertTheme={ false } />) : null;

    return (
        <div className={ `method-result ${ props.responseTab }` }>
            <div className="method-result-menu">
                <div data-tab="response" onClick={ event => props.onResponseTabChange('response') }>Response</div>
                <div data-tab="code" onClick={ event => props.onResponseTabChange('code') }>Javascript code</div>
            </div>
            <div className="response-container">
                { json }
            </div>
            <pre className="code-container">
                { props.code }
            </pre>
        </div>
    );
}

export default Response;