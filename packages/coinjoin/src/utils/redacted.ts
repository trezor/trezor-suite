// redact log messages with sensitive data wrapped in ~~ ~~ pattern
export const redacted = (message: string) =>
    typeof message === 'string'
        ? message.replace(/(~~([^~~]+)~~)/g, match => {
              if (match.length > 16) {
                  return `${match.substring(2, 10)}...${match.substring(
                      match.length - 10,
                      match.length - 2,
                  )}`;
              }

              return `[redacted]`;
          })
        : `${message}`;
