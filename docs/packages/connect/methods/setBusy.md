## Set busy

Show a "Do not disconnect" dialog instead of the standard homescreen.

```javascript
const result = await TrezorConnect.setBusy(params);
```

> :note: **Supported only by T2T1 with Firmware 2.5.3 or higher!**

### Params

[Optional common params](commonParams.md)

-   `expiry_ms` — _optional_ `number`
    > The time in milliseconds after which the dialog will automatically disappear. Overrides any previously set expiry. If not set, then the dialog is hidden.

### Result

```javascript
{
    success: true,
    payload: {
        message: 'Success',
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
