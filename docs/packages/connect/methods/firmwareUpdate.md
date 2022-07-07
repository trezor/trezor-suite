## firmwareUpdate

Installs a new firmware

```javascript
const result = await TrezorConnect.firmwareUpdate(params);
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

#### You either provide binary

-   `binary` — _required_ `bytes`

#### Or params

-   `version`: _required_ `number[]` version of firmware to be installed
-   `btcOnly`: `boolean` should install bitcoin only or regular firmware
-   `baseUrl`: `string` url to look for releases.json
-   `intermediary`: `boolean` should install intermediary firmware

### Example

```javascript
TrezorConnect.firmwareUpdate({
    version: '2.5.1',
});
```

### Result

```javascript
{
    success: true,
    payload: {
        // challenge used to compute expected firmware hash. only with firmware 1.11.1 and 2.5.1 or higher
        challenge: string,
        // expected firmware hash computed from the installed binary. only with firmware 1.11.1 and 2.5.1 or higher
        hash: string,

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
