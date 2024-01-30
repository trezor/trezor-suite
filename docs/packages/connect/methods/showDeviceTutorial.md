## Show device tutorial

Start the on device tutorial.

```javascript
const result = await TrezorConnect.showDeviceTutorial(params);
```

> :note: **Supported only by T2B1 with Firmware 2.6.1 or higher!**

### Params

[Optional common params](commonParams.md)

### Example:

```javascript
TrezorConnect.showDeviceTutorial({
    device,
});
```

### Result

Success type

```javascript
{
    success: true,
    payload: {
        message: 'Tutorial shown'
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
