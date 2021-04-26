import axios from 'axios';
import { Post } from './types';
import parser from 'fast-xml-parser';
import { MEDIUM_FEED_URL, MEDIUM_CDN_BASE, TREZOR_CDN_BASE, USER_AGENT } from './config';
import cheerio from 'cheerio';

const replaceCDNLink = (trezorLink?: string) => {
    if (!trezorLink) return undefined;
    return trezorLink.replace(MEDIUM_CDN_BASE, TREZOR_CDN_BASE);
};

const getPosts = (data: any, limit = 5) => {
    const posts = data.rss.channel.item;
    const result: Post[] = [];

    if (data.length < 1) {
        return null;
    }

    for (let i = 0; i < posts.length; i++) {
        if (result.length >= limit) break;

        const { title, pubDate, link } = posts[i];
        const $ = cheerio.load(posts[i]['content:encoded']);
        const thumbnail = replaceCDNLink($('img').first().attr('src'));

        if (link.includes('blog.trezor.io')) {
            result.push({
                title,
                description: $('p').first().text(),
                thumbnail,
                pubDate,
                link,
            });
        }
    }

    return result;
};

const fetcher = (
    callback: (statusCode: number, data: string | null, errMessage?: string) => void,
    limit?: number,
) => {
    axios
        .get(MEDIUM_FEED_URL, { headers: { 'User-Agent': USER_AGENT } })
        .then(response => {
            try {
                const data = parser.parse(response.data, {}, true);
                const posts = getPosts(data, limit);
                callback(200, JSON.stringify(posts));
            } catch (err) {
                callback(500, null, err.message);
            }
        })
        .catch(error => callback(error?.response?.status ?? 500, null, error.message));
};

export default fetcher;
