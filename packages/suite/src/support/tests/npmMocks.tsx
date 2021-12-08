/* eslint-disable max-classes-per-file */

import React from 'react';

// globally mock npm modules.
jest.mock('dropbox', () => {
    class Dropbox {
        filesUpload() {
            return true;
        }
        usersGetCurrentAccount() {
            return {
                result: {
                    // eslint-disable-next-line
                    name: { given_name: 'haf' },
                },
            };
        }
    }
    class DropboxAuth {
        getAuthenticationUrl() {
            return 'https://foo/bar';
        }
        getRefreshToken() {
            return 'token-haf-mnau';
        }
        getAccessToken() {
            return 'token-haf-mnau';
        }
        refreshAccessToken() {}
        setAccessToken() {}
    }
    return {
        __esModule: true,
        Dropbox,
        DropboxAuth,
    };
});

// @ts-ignore
jest.mock('react-markdown', () => props => <>{props.children}</>);

export {};
