import { useState, useEffect } from 'react';

const NEWS_API_URL = 'https://news.trezor.io';

interface Post {
    link: string;
    thumbnail: string;
    title: string;
    description: string;
}

export function useFetchNews() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isError, setError] = useState(false);
    const [fetchCount, incrementFetchCount] = useState(4);

    useEffect(() => {
        const abortController = new AbortController();

        fetch(`${NEWS_API_URL}/posts?limit=${fetchCount}`, { signal: abortController.signal })
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
