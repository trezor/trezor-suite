## Reset device

Perform device setup and generate new seed.

```javascript
const result = await TrezorConnect.resetDevice(params);
```

### Params

[Optional common params](commonParams.md)

-   `strength` — _optional_ `number` Accepted values are [128|192|256]. Default is set to `256`
-   `label` — _optional_ `string`
-   `u2fCounter` — _optional_ `number`. Default value is set to current time stamp in seconds.
-   `pinProtection` — _optional_ `boolean`
-   `passphraseProtection` — _optional_ `boolean`
-   `skipBackup` — _optional_ `boolean`
-   `noBackup` — _optional_ `boolean` create a seedless device

### Example

```javascript
TrezorConnect.resetDevice({
    label: 'My fancy Trezor',
});
```

### Result

Success type

```javascript
{
    success: true,
    payload: {
        message: 'Device successfully initialized'
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
