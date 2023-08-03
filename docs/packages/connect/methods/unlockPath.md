## Unlock path

Ask device to unlock a subtree of the keychain.

Result is used in `getPublicKey`, `getAddress` and `signTransaction` methods to access requested keychain which is not available by default.

```javascript
const result = await TrezorConnect.unlockPath(params);
```

> :warning: **This feature is experimental! Do not use it in production!**

> :note: **Supported only by T2T1 with Firmware 2.5.3 or higher!**

### Params

[Optional common params](commonParams.md)

-   `path` — _required_ `string | Array<number>`
    > prefix of the BIP-32 path leading to the account (m / purpose')

### Result

```javascript
{
    success: true,
    payload: {
        address_n: Array<number>,
        mac: string,
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
