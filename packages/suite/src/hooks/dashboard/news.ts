import { useState, useEffect } from 'react';

const NEWS_API_STAGING_URL = 'https://staging-news.trezor.io';
const NEWS_API_PRODUCTION_URL = 'https://news.trezor.io';

export function useFetchNews() {
    const [items, setItems] = useState<any[]>([]);
    const [isError, setError] = useState(false);
    const [fetchCount, incrementFetchCount] = useState(4);

    useEffect(() => {
        const origin =
            !!process.env.DEV_SERVER === true || process.env.BUILD === 'development'
                ? NEWS_API_STAGING_URL
                : NEWS_API_PRODUCTION_URL;

        fetch(`${origin}/posts?limit=${fetchCount}`)
            .then(response => response.json())
            .then(response => {
                if (response.length > 1) {
                    setItems(response);
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true));
    }, [fetchCount]);

    return { items, isError, incrementFetchCount, fetchCount };
}
