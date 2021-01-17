import React, { useState } from 'react';
import Announcement from './Announcement';
import { useFetchAnnouncements } from './UseFetchAnnouncements';

const Announcements = () => {
    const announcements = useFetchAnnouncements();
    const [dismissedMessages, setDismissedMessages] = useState<string[]>([])

    return <>{
        announcements
        .filter(a => !dismissedMessages.includes(a.message))
        .map(a => {
            if (!a.isDismissible) {
                return <Announcement key={a.message} message={a.message} />
            }

            const dismiss = () => {
                setDismissedMessages((dismissedMessages) => [...dismissedMessages, a.message])
            }
            return <Announcement key={a.message} message={a.message} isDismissible={true} onDismiss = {dismiss} />
        })
    }</>
};

export default Announcements;
