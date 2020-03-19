import axios from 'axios';
import { Post } from './types';

const URL = `https://medium.com/@satoshilabs?format=json`;

const getPosts = (json: string) => {
    const data = JSON.parse(json);
    const posts =
        (data.payload && data.payload.posts) ||
        (data.payload &&
            data.payload.references &&
            data.payload.references.Post &&
            Object.keys(data.payload.references.Post).map(
                key => data.payload.references.Post[key],
            ));

    return JSON.stringify(posts);
};

const cleanPosts = (posts: string) => {
    const parsedPosts = JSON.parse(posts);
    const result: Post[] = [];

    parsedPosts.map((post: any) => {
        const { id, title, content, virtuals } = post;
        const { subtitle } = content;
        const { previewImage } = virtuals;
        return result.push({ id, title, subtitle, image: previewImage.imageId });
    });

    return result;
};

export default async (callback: (status: number, json: string | null) => void) => {
    axios
        .get(URL)
        .then(response => {
            const result = response.data.replace(`])}while(1);</x>`, '');
            const posts = getPosts(result);

            if (!posts) {
                callback(
                    500,
                    "Could not parse the resource. Medium's JSON format might have changed.",
                );
            }

            const cleanedPosts = cleanPosts(posts);
            console.log('cleanedPosts', cleanedPosts);
            callback(200, JSON.stringify(cleanedPosts));
        })
        .catch(error => console.log(error));
};
