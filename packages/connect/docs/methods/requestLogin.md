## Request login

Challenge-response authentication via Trezor. To protect against replay attacks
you should use a server-side generated and randomized `challengeHidden` for every
attempt. You can also provide a visual challenge that will be shown on the
device.

Service backend needs to check whether the signature matches the generated
`challengeHidden`, provided `challengeVisual` and stored `publicKey` fields.
If that is the case, the backend either creates an account (if the `publicKey`
identity is seen for the first time) or signs in the user (if the `publicKey`
identity is already a known user).

To understand the full mechanics, please consult the Challenge-Response chapter
of
[SLIP-0013: Authentication using deterministic hierarchy](https://github.com/satoshilabs/slips/blob/master/slip-0013.md).

ES6

```javascript
const result = await TrezorConnect.requestLogin(params);
```

CommonJS

```javascript
TrezorConnect.requestLogin(params).then(function (result) {});
```

### Params

[\***\*Optional common params\*\***](commonParams.md)
<br>
Common parameter `useEmptyPassphrase` - is always set to `true` and it will be ignored by this method

#### Login using server-side async challenge

-   `callback` — _required_ `function` which will be called from API to fetch `challengeHidden` and `challengeVisual` from server

#### Login without async challenge

-   `challengeHidden` - _required_ `string` hexadecimal value
-   `challengeVisual` - _required_ `string` text displayed on Trezor

### Example

###### Login using server-side async challenge

```javascript
TrezorConnect.requestLogin({
    callback: function () {
        // here should be a request to server to fetch "challengeHidden" and "challengeVisual"
        return {
            challengeHidden: '0123456789abcdef',
            challengeVisual: 'Login to',
        };
    },
});
```

###### Login without async challenge

```javascript
TrezorConnect.requestLogin({
    challengeHidden: '0123456789abcdef',
    challengeVisual: 'Login to',
});
```

### Result

```javascript
{
    success: true,
    payload: {
        address: string,
        publicKey: string,
        signature: string,
    }
}
```

Error

```javascript
{
    success: false,
    payload: {
        error: string // error message
    }
}
```

### Server side examples

Here is the reference implementation of the server-side signature verification
written in various languages:

-   [**C#**](server/server.cs)
-   [**Javascript**](server/server.js)
-   [**PHP**](server/server.php)
-   [**Python**](server/server.py)
-   [**Ruby**](server/server.rb)
-   [**Go**](server/server.go)

### Migration from older version

version 4 and below

```javascript
// site icon, optional. at least 48x48px
var hosticon = 'https://example.com/icon.png';
// server-side generated and randomized challenges
var challenge_hidden = '';
var challenge_visual = '';
TrezorConnect.requestLogin(
    hosticon,                // hosticon is moved to common parameters
    challenge_hidden,
    challenge_visual
    function(result) {
        result.signatures    // not changed
        result.public_key    // renamed to "publicKey"
        result.version       // removed, it's not possible to use this method witch outdated firmware
        // added "address" field
    }
);
```

version 5

```javascript
// params are key-value pairs inside Object
TrezorConnect.requestLogin({
    challengeHidden: '',
    challengeVisual: '',
}).then(function(result) {
    ...
})
```
