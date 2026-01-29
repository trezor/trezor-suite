// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';

import { getSecurityHeaders } from './constants/webSecurityHeaders';

export default defineConfig({
    preview: {
        port: 8000,
        open: true,
        headers: getSecurityHeaders(),
    },
});
