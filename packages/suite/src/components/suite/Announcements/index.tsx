import React from 'react';
import Announcement from './Announcement';
import { useFetchAnnouncements } from './UseFetchAnnouncements';

const Announcements = () => {
    const announcements = useFetchAnnouncements();
    return <>{
        announcements.map(a => <Announcement key={a} message={a} />)
    }</>
};

export default Announcements;
