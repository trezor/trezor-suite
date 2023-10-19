## Apply settings

Change device settings

```javascript
const result = await TrezorConnect.applySettings(params);
```

### Params

[Optional common params](commonParams.md)

-   `flags` — _optional_ `string`
-   `use_passphrase` - _optional_ `boolean`
-   `homescreen` - _optional_ `bytes`
-   `auto_lock_delay_ms` - _optional_ `number`
-   `display_rotation` - _optional_ `0|90|180|270`
-   `passphrase_always_on_device` - _optional_ `boolean`
-   `safety_checks` - _optional_ enum `"PromptTemporarily" | "Strict" | "PromptAlways"`
-   `experimental_features` - _optional_ `boolean`
-   `hide_passphrase_from_host` - _optional_ `boolean`

### Result

```javascript
{
    success: true,
    payload: {
        message: "Settings applied"
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
