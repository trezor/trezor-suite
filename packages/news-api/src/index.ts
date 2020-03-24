import axios from 'axios';
import { Post } from './types';
import { FEED_URL } from './config';
import cheerio from 'cheerio';

const cleanData = (data: any, limit = 5) => {
    const result: Post[] = [];

    if (data.length < 1) {
        return null;
    }

    for (let i = 0; i < data.length; i++) {
        if (result.length > limit) break;
        const { title, thumbnail, pubDate, link, description } = data[i];
        const $ = cheerio.load(description);
        if (link.includes('blog.trezor.io')) {
            result.push({
                title,
                thumbnail,
                pubDate,
                link,
                description: $('p').first().text(),
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
            const data = response.data.items;
            const parsedData = cleanData(data, limit);
            callback(200, JSON.stringify(parsedData));
        })
        .catch(error => callback(500, null, error.message));
};
