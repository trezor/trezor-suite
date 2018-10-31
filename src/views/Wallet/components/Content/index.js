import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Loader from 'components/Loader';
import { FONT_SIZE } from 'config/variables';
import colors from 'config/colors';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
`;

const Loading = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    flex-direction: row;
`;

const Text = styled.div`
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_SECONDARY};
    margin-left: 10px;
`;

const Content = ({
    children,
    isLoading = false,
}) => (
    <Wrapper>
        {!isLoading && children}
        {isLoading && (
            <Loading>
                <Loader size={30} />
                <Text>Initializing accounts</Text>
            </Loading>
        )}
    </Wrapper>
);

Content.propTypes = {
    children: PropTypes.element,
    isLoading: PropTypes.bool,
};

export default Content;
