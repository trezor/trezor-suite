import type { Options } from '@sentry/core';

import { ignoreErrorsCommon } from '@suite-common/sentry';

export const ignoreErrors: RegExp[] = [
    ...ignoreErrorsCommon,
    /.*Websocket closed.*/,
    /.*Network request failed.*/,
] satisfies Options['ignoreErrors'];
