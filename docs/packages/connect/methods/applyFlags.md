## Apply flags

Change device flags. This methods allows you to set a mark on device (number) which must not be lower than
previously set flag.

```javascript
const result = await TrezorConnect.applyFlags(params);
```

### Params

[Optional common params](commonParams.md)

-   `flags` — required `number`

### Result

```javascript
{
    success: true,
    payload: {
        message: "Flags applied"
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
