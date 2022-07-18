# Application Log

Application Log findable in Settings > General in Trezor Suite provides valuable info to the Support Team when helping our users.

The application log is in JSON format. It starts with App & Platform information and below it, it contains the last 200 meaningful redux actions ordered from the oldest one to the newest one.

## App & Platform information

Contains basic information about the user's platform and app status at the time of displaying the Application log such as:

-   app version
-   browser name and version
-   transport type
-   number of connected devices
-   enabled networks and custom backends
-   ...

See `getApplicationInfo` method in `logsUtils.ts` in `suite` package.

## Redux actions

Hundreds of redux actions are fired when using Trezor Suite. The actions, which should help the Support Team understand the user's problem, are logged.
Each log record consists of:

-   `type` which should express the type of user's action.
-   `datetime` showing UTC when user action occurred
-   `payload` containing additional information

Example log record occurred when user's internet connectivity status changed to offline

```json
{
    "type": "@suite/online-status",
    "datetime": "Mon, 18 Jul 2022 13:11:30 GMT",
    "payload": {
        "status": false
    }
}
```

See `logsMiddleware.ts` in `suite` package.

### Sensitive information

Some actions contain sensitive information such as device id, transactions or XPUB.
The user has an option to redact it using the switch button in the Application Log window under the log.

Some of the redux actions are modified even before they are logged. For example, in `BLOCKCHAIN.SET_BACKEND` action, we log only coin, URL is stripped off immediately.

# Extending

## Requests

There is a page in Notion [Engineering/Suite/Application Log](https://www.notion.so/satoshilabs/Application-log-1908fc91f1564da480a55ea487fdd6e6) where the Support Team can add requests to extend the application log either by new items to App & Platform information or by logging new redux action / extending current ones.

## New redux action

Redux action name has to be added to `logsMiddleware.ts` and if it contains sensitive information, it should be redacted using `redactAction` method in `logsUtils.ts`.
