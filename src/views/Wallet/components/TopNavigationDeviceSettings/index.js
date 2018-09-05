/* @flow */

import styled from 'styled-components';
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

type Props = {
    pathname: string;
}
type State = {
    style: {
        width: number,
        left: number
    };
}

const Wrapper = styled.div``;

const AccountTabs = (props: any): any => {
    const urlParams = props.match.params;
    const basePath = `/device/${urlParams.device}/network/${urlParams.network}/account/${urlParams.account}`;

    return (
        <Wrapper>
            Device settings
        </Wrapper>
    );
};

export default AccountTabs;