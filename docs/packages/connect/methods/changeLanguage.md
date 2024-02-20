## Change language

This method initiates language change.

```javascript
const result = await TrezorConnect.changeLanguage(params);
```

### Params

[Optional common params](commonParams.md)

-   `language` — _required_ `string`. (cs-CZ, de-DE) whatever language variant is available for given model and firmware version
-   `baseUrl` - _optional_ `string`. where language blob should be downloaded from. Default value is https://data.trezor.io

or

-   `binary` — _required_ `ArrayBuffer`. directly provide language file

### Result

```javascript
{
    success: true,
    payload: {
        message: "Language changed"
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
