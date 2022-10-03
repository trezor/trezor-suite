import fetch from 'node-fetch';

// @ts-expect-error
global.fetch = fetch;
