## Wipe device

Reset device to factory defaults and remove all private data.

```javascript
const result = await TrezorConnect.wipeDevice(params);
```

### Params

[Optional common params](commonParams.md)

Common parameter `useEmptyPassphrase` - is set to `true`
Common parameter `allowSeedlessDevice` - is set to `true`

### Example

```javascript
TrezorConnect.wipeDevice();
```

### Result

Success type

```javascript
{
    success: true,
    payload: {
        message: 'Device wiped'
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
