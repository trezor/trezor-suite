# @trezor/auth-server

Authorization endpoints for saving labels in Google Drive via OAuth 2.0.

Google requires `client_secret` specific for an app to grant long term access to a user via a `refresh_token`. This is a [recommended](https://developers.google.com/identity/protocols/oauth2/native-app) OAuth flow for desktop apps. Exposing `client_secret` could potentially enable attackers impersonating the app to gain access to the user's labels. Therefore, Google authentication server is accessed via our backend which stores the `client_secret`. Unlike the [Dropbox](https://developers.dropbox.com/oauth-guide) OAuth implementation, it is not possible to substitute the secret with PKCE.

## Development

Start by generating your own testing credentials for Suite Desktop.<br />
Please note that instructions regarding Google Cloud configuration may not be up to date.

1. Open [Google Cloud Platform > Credentials](https://console.cloud.google.com/apis/credentials) and create a new "OAuth 2.0 Client ID" credential.
1. If you are not in a "Project" already, you'll have to create one and assign it to an "Organization".<br />
   ⚠️ You may have to use a personal Google profile, if your corporate account has insufficient rights to create/edit organizations!
1. Select "Desktop app" and set any name.
1. Navigate through "OAuth consent screen" to ["Audience"](https://console.cloud.google.com/auth/audience) and add yourself and/or any other emails as "Test users".<br />
   _Not to be mistaken with Service Accounts, those are unrelated._

Continue in Trezor Suite:

1. Replace `client_secret` in [index.ts](./src/index.ts) and `CLIENT_ID` in [@trezor/suite](../suite/src/actions/suite/constants/metadataProviderConstants.ts) with generated credentials.
1. Set OAuth API in Suite debug settings to `http://localhost:3005` or override the `authServerUrl` [here](../suite/src/services/google.ts).
1. Install dependencies via `yarn workspace @trezor/auth-server install`.
1. Run the server locally via `yarn workspace @trezor/auth-server dev`.

## Build

`yarn workspace @trezor/auth-server build`
