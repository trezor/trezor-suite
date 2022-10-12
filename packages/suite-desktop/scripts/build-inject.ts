import fetch from 'node-fetch';

// @ts-expect-error
global.fetch = fetch;

// fix bcrypto - use JS implementaion instead of native binaries
process.env.NODE_BACKEND = 'js';
