import { promises as fs } from 'fs';
import { fetchFirmware as httpFetch } from './fetch-browser';

// This module should be used only in nodejs environment. see package.json "browser" field.
export const fetchFirmware = (url: string) => {
    // url with protocol can be fetched using cross-fetch
    if (/^https?/.test(url)) return httpFetch(url);
    // otherwise read file from local filesystem
    return fs.readFile(url);
};
