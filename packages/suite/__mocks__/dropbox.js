// mock 'dropbox' package

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
    setRefreshToken() {}
    getAccessToken() {
        return 'token-haf-mnau';
    }
    refreshAccessToken() {}
    setAccessToken() {}
}

module.exports = {
    __esModule: true,
    Dropbox,
    DropboxAuth,
};
