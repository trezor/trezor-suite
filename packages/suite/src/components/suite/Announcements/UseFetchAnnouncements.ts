import { useState, useEffect } from 'react';

const ANNOUNCEMENTS_API_URL = 'https://gist.githubusercontent.com/goodhoko/fb87ac361a3e13b752e240324dd367df/raw/1099148ee6299cc5500f635882fa5451796fbb79/trezor_announcements_v1.json';

export function useFetchAnnouncements() {
    const [announcements, setAnnouncements] = useState<string[]>([]);

    const fetchAnnouncements = () => {
        fetch(ANNOUNCEMENTS_API_URL)
            .then(response => response.json())
            .catch(err => {
                console.error('Could not fetch announcements.', err);
                return [];
            })
            .then(announcements => {
                setAnnouncements(announcements)
            })
    }

    useEffect(() => {
        // Fetch on mount.
        fetchAnnouncements();
        // Re-fetch every 10 minutes.
        const interval = setInterval(fetchAnnouncements, 1000 * 60 * 10)
        return () => {
            // Clear the interval on unmount.
            clearInterval(interval)
        }
    }, []);

    return announcements;
}
