import React from 'react';
import Announcement from './Announcement';

const Announcements = (props: {announcements: string[]}) => {
    return <>{
        props.announcements.map(a => <Announcement key={a} message={a} />)
    }</>
};

export default Announcements;
