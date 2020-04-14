import { useState, useEffect } from 'react';
import { isDev } from '@suite-utils/build';

const NEWS_API_STAGING_URL = 'https://staging-news.trezor.io';
const NEWS_API_PRODUCTION_URL = 'https://news.trezor.io';
// const LOCAL_DEV = 'http://localhost:3003';

export function useFetchNews() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isError, setError] = useState(false);
    const [fetchCount, incrementFetchCount] = useState(4);

    useEffect(() => {
        const origin = isDev ? NEWS_API_STAGING_URL : NEWS_API_PRODUCTION_URL;

        fetch(`${origin}/posts?limit=${fetchCount}`)
            .then(response => response.json())
            .then(response => {
                if (response.length > 1) {
                    setPosts(response);
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true));
    }, [fetchCount]);

    return { posts, isError, incrementFetchCount, fetchCount };
}
