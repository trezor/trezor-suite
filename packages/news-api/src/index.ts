import axios from 'axios';
import { Post } from './types';
import parser from 'fast-xml-parser';
import { FEED_URL } from './config';
import cheerio from 'cheerio';

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

        if (link.includes('blog.trezor.io')) {
            result.push({
                title,
                description: $('p').first().text(),
                thumbnail: $('img').first().attr('src'),
                pubDate,
                link,
            });
        }
    }

    return result;
};

export default async (
    limit: number,
    callback: (statusCode: number, data: string | null, errMessage?: string) => void,
) => {
    axios
        .get(FEED_URL)
        .then(response => {
            try {
                const data = parser.parse(response.data, {}, true);
                const posts = getPosts(data, limit);
                callback(200, JSON.stringify(posts));
            } catch (err) {
                callback(500, null, err.message);
            }
        })
        .catch(error => callback(500, null, error.message));
};
