# Desktop Logger
The desktop application includes a logging library to display various types of log in the console or in a file.

Four (or five if we count 'mute') log levels are currently implemented:
- error (1)
- warn (2)
- info (3)
- debug (4)

All messages with an inferior level to the selected one will be displayed. For example, if the selected log level is _info_, then it will also display _warn_ and _error_ messages.

## How to enable logging
Logging can be enabled by running Suite with the command line flag `--log-level=LEVEL` (replace _LEVEL_ with _error_, _warn_, _info_ or _debug_ based on the logging you wish to display). Additional command line flags can be found on the [Suite-Desktop page](../packages/suite-desktop.md).

## API
### Exported Types
#### LogLevel
Any of the following values:
- mute (0)
- error (1)
- warn (2)
- info (3)
- debug (4)

#### Options (all optional)
| name | type | default value | description |
| --- | --- | --- | --- |
| colors | boolean | `true` | Console output has colors |
| writeToConsole | boolean | `true` | Output is displayed in the console |
| writeToDisk | boolean | `false` | Output is written to a file |
| outputFile | string | `'log-%ts.txt'` | file name for the output |
| outputPath | string | Home or CWD | path for the output |
| logFormat | string | `'%dt - %lvl(%top): %msg'` | Output format of the log |

### String formatters
The options `outputFile` and `logFormat` can be used with some expressions, prefixed with the percent (%) symbol, to apply certain dynamic elements. It is for example possible to display a timestamp or the current date & time in the listed options above. While some expressions can be used in any strings, some strings have their own expressions.

#### Global
| Expression | Example output | Description |
| --- | --- | --- |
| `%ts` | `1611054460306` | Timestamp |
| `%dt` | `2021-01-19T11:08:22.244Z` | Date and time in ISO format (ISO 8601) |

#### logFormat
| Expression | Example output | Description |
| --- | --- | --- |
| `%lvl` | `INFO` | Level in letters and upper case |
| `%top` | `Example` | Topic |
| `%msg` | `Example message` | Message |

### Constructor
The constructor has the following parameters:
- level (LogLevel): Selected log level (see LogLevels in **Exported Types** above)
- options (Options): Optional parameter containing settings for the logger (see Options in **Exported Types** above)

### Log methods
All log methods have the same signature as they are just wrappers around a private logging method.

The following methods are available:
- `error(topic: string, messages: string | string[]); // level: 1`
- `warn(topic: string, messages: string | string[]); // level: 2`
- `info(topic: string, messages: string | string[]); // level: 3`
- `debug(topic: string, messages: string | string[]); // level: 4`

Parameters:
- **topic** (string): Message topic
- **messages** (string | string[]): Single message or array of messages which will be displayed one by line. 

### Exit method
The `exit()` method is used to close the write stream of the log file. If you are not planning to write logs to disk, you won't need to use this method. Otherwise it is highly advised to place this inside exit/crash callbacks.

### Example
```typeScript
const logger = new Logger('warn', {
    colors: false, // Turning off colors
    logFormat: '%lvl: %msg', // Level and message only
    writeToDisk: true, // Write to disk
    outputFile: 'log-desktop.txt', // Static file name, will be overwritten if it exists
});

// These messages will be printed with the level provided above
logger.error('example', 'This is an example error message with the topic "example"');
logger.warn('example', 'This is an example warn message with the topic "example"');

// And these won't
logger.info('example', 'This is an example info message with the topic "example"');
logger.debug('example', 'This is an example debug message with the topic "example"');

// Closes the write stream (only needed of writing the log file)
logger.exit();
```

## Q&A
### How to format a string?
The library does not have any formatting capabilities as JavaScript already has templating features built-in. Simply use string literals (for example: ```logger.info('Topic', `My string ${myvar}.`)```).

### How to output an object?
The library does not include any helper for this as there is already a language feature that does this. Simply use `JSON.stringify(myObject)`.

### How can I write the log in JSON format?
You can change the `logOutput` option to be formatted like JSON. For example: `logOutput: '{ "ts": "%ts", "lvl": "%lvl", "topic": "%top", "message": "%msg" },'`. 
In order to display/use it properly, you will have to edit the output a little bit. Wrap all the messages in square brakets ([, ]) and remove the comma (,) from the last message. 
