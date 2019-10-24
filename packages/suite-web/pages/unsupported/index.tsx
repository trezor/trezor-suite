import React from 'react';
import { resolveStaticPath } from '@suite-utils/nextjs';

const H1Style = {
    textRendering: 'optimizeLegibility' as 'optimizeLegibility',
    color: '#494949',
    fontWeight: 'bold' as 'bold',
    margin: 0,
    padding: 0,
    fontSize: '2rem',
    paddingBottom: '10px',
};

const PStyle = {
    fontSize: '1rem',
    lineHeight: 1.8,
    color: '#757575',
    padding: 0,
    margin: 0,
};

const ButtonStyle = {
    display: 'inline',
    position: 'relative' as 'relative',
    alignItems: 'center',
    padding: '11px 24px',
    textAlign: 'center' as 'center',
    borderRadius: '3px',
    fontSize: '1rem',
    fontWeight: 300,
    cursor: 'pointer',
    outline: 'none',
    background: '#01B757',
    color: '#FFFFFF',
    border: '1px solid #01B757',
    justifyContent: 'center',
    marginTop: '15px',
};

const WrapperStyle = {
    display: 'none',
    position: 'absolute' as 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    background: '#fff',
    zIndex: 99999,
    textAlign: 'center' as 'center',
    paddingTop: '150px',
};

const UnsupportedBrowser = () => (
    <div id="unsupported-browser" style={WrapperStyle}>
        <div id="download-browser">
            <h1 style={H1Style}>Your browser is not supported</h1>
            <p style={PStyle}>Please choose one of the supported browsers</p>
            <div
                style={{
                    width: '300px',
                    margin: '15px auto',
                }}
            >
                <div
                    style={{
                        float: 'left',
                        width: '50%',
                        textAlign: 'center',
                    }}
                >
                    <img src={resolveStaticPath('images/browser-chrome.png')} alt="Chrome" />
                    <div style={{ display: 'block' }}>
                        <a
                            href="https://www.google.com/chrome/"
                            target="_blank"
                            style={ButtonStyle}
                            rel="noopener noreferrer"
                        >
                            Get Chrome
                        </a>
                    </div>
                </div>
                <div
                    style={{
                        float: 'left',
                        width: '50%',
                        textAlign: 'center',
                    }}
                >
                    <img src={resolveStaticPath('images/browser-firefox.png')} alt="Firefox" />
                    <div style={{ display: 'block' }}>
                        <a
                            href="https://www.mozilla.org/firefox/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={ButtonStyle}
                        >
                            Get Firefox
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <div
            id="update-chrome"
            style={{
                display: 'none',
            }}
        >
            <h1 style={H1Style}>Your browser is outdated</h1>
            <p style={PStyle}>Please update your browser to the latest version.</p>
            <a
                href="https://support.google.com/chrome/answer/95414?co=GENIE.Platform%3DDesktop&hl=en"
                target="_blank"
                style={ButtonStyle}
                rel="noopener noreferrer"
            >
                Update Chrome
            </a>
        </div>
        <div
            id="update-firefox"
            style={{
                display: 'none',
            }}
        >
            <h1 style={H1Style}>Your browser is outdated</h1>
            <p style={PStyle}>Please update your browser to the latest version.</p>
            <a
                href="https://support.mozilla.org/en-US/kb/update-firefox-latest-release"
                target="_blank"
                style={ButtonStyle}
                rel="noopener noreferrer"
            >
                Update Firefox
            </a>
        </div>
    </div>
);

export default UnsupportedBrowser;
