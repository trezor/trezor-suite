# AWS Analytics: Info

_For a deeper technical writeup of analytics processes intended for developers, please see [README.md](https://github.com/trezor/trezor-suite/blob/develop/packages/analytics/README.md)._

Trezor Suite can be set to collect real-world data to improve the performance of both web and desktop apps. This anonymous data is only shared by users who have usage data tracking enabled.

During the first run Trezor Suite prompts the user whether they wish to participate in the data collection and such setting can be changed later on in Settings at any time.

## Anonymous data

Collected data are anonymous. This means that **Suite does not track** personal information and can not be used to view particular users' balances.

Among the data **not collected** by analytics:

-   Device IDs
-   Public keys
-   Particular amounts
-   Transaction IDs

When data tracking is enabled, Trezor Suite collects functional information that can be used to directly improve the app, such as:

-   Events triggered by a user during a session
-   Hardware, operating system and setup of the connected device
-   Errors encountered during a session

## Data process

1. User with enabled analytics interacts with the application
1. Events are sent to specific endpoints
1. Collected data are parsed and analysed (can be seen in Keboola)
1. Charts and metrics are created (in Tableau)
1. We know how to improve the application
