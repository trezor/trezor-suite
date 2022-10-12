import fetch from 'node-fetch';

// @ts-expect-error
global.fetch = fetch;

// fix bcrypto - use JS implementaion to prevent using binaries for wrong architecture
process.env.NODE_BACKEND = 'js';
