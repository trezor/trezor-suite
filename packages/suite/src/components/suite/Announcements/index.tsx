import React, { useState } from 'react';
import Announcement from './Announcement';
import { useFetchAnnouncements } from './UseFetchAnnouncements';

const KEY = 'trezor:announcements';

const getDismissedMessages: () => string[] = () => {
    const json = window.localStorage.getItem(KEY);
    if (json === null) {
        return []
    }
    return JSON.parse(json)
}

const persistDismissedMessage = (hash: string) => {
    const messages = [...getDismissedMessages(), hash]
    window.localStorage.setItem(KEY, JSON.stringify(messages))
}

const Announcements = () => {
    const announcements = useFetchAnnouncements();
    const [dismissedMessages, setDismissedMessages] = useState(getDismissedMessages())

    return <>{
        announcements
        .filter(a => !dismissedMessages.includes(a.message))
        .map(a => {
            if (!a.isDismissible) {
                return <Announcement key={a.message} message={a.message} />
            }

            const dismiss = () => {
                persistDismissedMessage(a.message)
                setDismissedMessages((dismissedMessages) => [...dismissedMessages, a.message])
            }
            return <Announcement key={a.message} message={a.message} isDismissible={true} onDismiss = {dismiss} />
        })
    }</>
};

export default Announcements;
