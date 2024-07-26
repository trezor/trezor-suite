## Show device tutorial

Start the on device tutorial.

```javascript
const result = await TrezorConnect.showDeviceTutorial(params);
```

> :note: **Not supported on T1B1 and T2T1**

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
