# Data Analytics

Anonymous[^1] data volunteered by Trezor users directly contributes to improved performance across all the platforms you use Trezor Suite on.

[^1]: "Anonymous" means that we do not collect any sensitive personal information. AWS and Sentry are able to view IP addresses but they are not tracked or collected by Trezor and Trezor removes such information from the logs automatically. Enable Tor to mask your IP address from third parties when using Trezor Suite.

Participation is easy and completely optional. Enable or disable usage data sharing with one click at any time in Trezor Suite Settings. With full control over what you contribute, you can safely take part in making Bitcoin more secure.

**TL;DR**

1. Data is only collected with explicit permission.
1. Your sensitive data is not collected.
1. We use AWS logging for data analytics and Sentry for error tracking.
1. We store the data concerning errors for the period of 90 days.
1. Only limited amount of users is able to access the data.

## What data is collected?

When enabled, purely functional data about how the app is used will be collected and analyzed to find defects and inefficiencies. With explicit consent, both web and desktop applications may collect anonymous data such as user interactions with app functions, errors, hardware specifications and app response times.

If usage data is disabled only the decision not to share any data is recorded. This means we do not collect any data, automated Sentry reports (see below) or any other data. An exception is when a user specifically chooses to submit feedback or bug reports through Trezor Suite.

## How are the data processed?

Data are logged in the form of HTTPS requests to an AWS S3 bucket. Those data logs are then transformed into sets which can be analyzed to give meaningful information. See [AWS](aws.md) for more detailed info about the particular events which are tracked.

## Error tracking using Sentry

To catch errors quickly and deliver you the best experience with your Trezor, we use [Sentry.io](https://sentry.io/), a tool for error tracking and performance monitoring. Data is only available to Sentry when usage data tracking is enabled. See our page about [Sentry](./sentry.md) for more information on how it works.

## Retention period

By principle, the logs collected are destroyed without delay once the purpose of use is met. However, the minimum retention period equals to 90 days when the data is processed to improve Trezor Suite. The 90 days are related to the data concerning any errors occurring in Trezor Suite. Performance related data may be stored for longer periods of time. When the retention period ends, all event data and most metadata is eradicated from the storage and from the servers without additional archiving in order to prevent the threat of intrusion.

## Security of data

Access to the data is limited strictly to the members of the development, security and IT team. All users are provided access on the need-to-know basis and the accesses are regularly reviewed. Users accessing the data log in using a strong combination of username and password and use two-factor authentication (where provided by a service provider).

## Contents

-   [AWS](./aws.md)
-   [Sentry](./sentry.md)
-   [Generic analytics package](https://github.com/trezor/trezor-suite/blob/develop/packages/analytics/README.md)
-   [Suite analytics package](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-analytics/README.md)
