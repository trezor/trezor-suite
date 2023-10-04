/* eslint-disable max-classes-per-file */

jest.mock('dropbox', () => {
    class Dropbox {
        filesUpload() {
            return true;
        }
        usersGetCurrentAccount() {
            return {
                result: {
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

// @ts-expect-error
jest.mock('react-markdown', () => props => <>{props.children}</>);

export {};
