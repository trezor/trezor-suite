import { useState, useEffect } from 'react';
// import { isDev } from '@suite-utils/build';

// const NEWS_API_STAGING_URL = 'https://staging-news.trezor.io';
// const NEWS_API_PRODUCTION_URL = 'https://news.trezor.io';
const LOCAL_DEV = 'http://localhost:3003';

export function useFetchNews() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isError, setError] = useState(false);
    const [fetchCount, incrementFetchCount] = useState(4);

    useEffect(() => {
        const abortController = new AbortController();
        const origin = LOCAL_DEV;
        // const origin = isDev() ? NEWS_API_STAGING_URL : NEWS_API_PRODUCTION_URL;

        fetch(`${origin}/posts?limit=${fetchCount}`, { signal: abortController.signal })
            .then(response => response.json())
            .then(response => {
                if (response.length > 1) {
                    setPosts(response);
                } else {
                    setError(true);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    // do not mutate state on error coming from AbortController as that means the component was unmounted
                    setError(true);
                }
            });
        return () => {
            abortController.abort();
        };
    }, [fetchCount]);

    return { posts, isError, incrementFetchCount, fetchCount };
}
