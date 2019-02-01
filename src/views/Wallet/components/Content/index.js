/* @flow */

import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Loader from 'components/Loader';
import { FONT_SIZE, FONT_WEIGHT, SCREEN_SIZE } from 'config/variables';
import { H1 } from 'components/Heading';
import P from 'components/Paragraph';
import colors from 'config/colors';

import type { State } from 'flowtype';

import FirmwareUpdate from 'views/Wallet/views/FirmwareUpdate';
import FirmwareUnsupported from './components/FirmwareUnsupported';

type Props = {
    children?: React.Node,
    isLoading?: boolean,
    loader?: $ElementType<$ElementType<State, 'selectedAccount'>, 'loader'>,
    exceptionPage?: $ElementType<$ElementType<State, 'selectedAccount'>, 'exceptionPage'>,
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;

    @media screen and (max-width: ${SCREEN_SIZE.SM}){
        padding: 20px 35px;
    }
`;

const Loading = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`;

const Title = styled(H1)`
    font-size: ${FONT_SIZE.BIGGER};
    font-weight: ${FONT_WEIGHT.NORMAL};
    color: ${props => (props.type === 'progress' ? colors.TEXT_SECONDARY : '')};
    margin-left: 10px;
    text-align: center;
`;

const Message = styled(P)`
    text-align: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const getExceptionPage = (exceptionPage) => {
    const { title, message, shortcut } = exceptionPage;
    switch (exceptionPage.type) {
        case 'fwOutdated':
            return <FirmwareUpdate />;
        case 'fwNotSupported':
            return <FirmwareUnsupported title={title} message={message} networkShortcut={shortcut} />;
        default: return null;
    }
};

const Content = ({
    children,
    isLoading = false,
    loader,
    exceptionPage,
}: Props) => (
    <Wrapper>
        {(!isLoading) && children}
        {isLoading && exceptionPage && getExceptionPage(exceptionPage)}
        {isLoading && loader && (
            <Loading>
                <Row>
                    {loader.type === 'progress' && <Loader size={30} />}
                    <Title type={loader.type}>{loader.title || 'Initializing accounts'}</Title>
                </Row>
                {loader.message && <Message>{loader.message}</Message>}
            </Loading>
        )}
    </Wrapper>
);

Content.propTypes = {
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
    isLoading: PropTypes.bool,
    loader: PropTypes.object,
    exceptionPage: PropTypes.object,
};

export default Content;
