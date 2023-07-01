## Change pin

This method initiates pin change sequence.

```javascript
const result = await TrezorConnect.changePin(params);
```

### Params

[Optional common params](commonParams.md)

-   `remove` — _optional_ `boolean`

### Result

```javascript
{
    success: true,
    payload: {
        message: "PIN enabled" | "PIN removed"
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
