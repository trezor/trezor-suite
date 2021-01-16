import styled from 'styled-components';
import React from 'react';

const Wrapper = styled.div`
    background-color: #AC61D0;
    width: 100%;
    padding: 1em;
    color: #fff;
`;

const Announcement = (props: {message: string}) => {
    return <Wrapper>{props.message}</Wrapper>;
};

export default Announcement;
