import { useState, useEffect } from 'react';

const ANNOUNCEMENTS_API_URL = 'https://gist.githubusercontent.com/goodhoko/fb87ac361a3e13b752e240324dd367df/raw/a8c011271dd2ed598132afb89aaa0814e38ed5a1/trezor_announcements_v1.json';

interface AnnouncementDTO {
    message: string,
    isDismissible: boolean,
}

export function useFetchAnnouncements() {
    const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([]);

    const fetchAnnouncements = () => {
        fetch(ANNOUNCEMENTS_API_URL)
            .then(response => response.json())
            .catch(err => {
                console.error('Could not fetch announcements.', err);
                return [];
            })
            .then(response => {
                setAnnouncements(response.announcements)
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
