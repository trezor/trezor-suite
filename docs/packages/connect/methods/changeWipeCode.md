## Change wipe code

This method initiates wipe code change sequence.

```javascript
const result = await TrezorConnect.changeWipeCode(params);
```

### Params

[Optional common params](commonParams.md)

-   `remove` — _optional_ `boolean`

### Result

```javascript
{
    success: true,
    payload: {
        message: string
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
