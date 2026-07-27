import { type Url } from './types';

export const withOpenChat = (url: Url): Url => {
    const [baseUrl] = url.split('#');

    return `${baseUrl}#open-chat` as Url;
};
