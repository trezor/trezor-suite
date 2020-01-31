import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { H2, P, colors, Loader, variables } from '@trezor/components-v2';
import { ExceptionPage, Loader as LoaderInterface } from '@wallet-reducers/selectedAccountReducer';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import FirmwareUnsupported from './components/FirmwareUnsupported';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
    max-width: 1024px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 20px 35px;
    }
`;

const Loading = styled.div`
    display: flex;
    justify-content: center;
`;

const LoaderWrapper = styled.div`
    margin-right: 10px;
`;

interface TitleProps {
    type: string;
}

const Title = styled(H2)`
    color: ${(props: TitleProps) => (props.type === 'progress' ? colors.BLACK50 : '')};
    padding: 0;
`;

const Message = styled(P)`
    text-align: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const getExceptionPage = (exceptionPage: ExceptionPage) => {
    const { title, message, symbol } = exceptionPage;
    switch (exceptionPage.type) {
        case 'fwOutdated':
            return '<FirmwareUpdate />';
        case 'fwNotSupported':
            return <FirmwareUnsupported title={title} message={message} symbol={symbol} />;
        default:
            return null;
    }
};

interface Props {
    className?: string;
    children?: ReactNode | ReactNode[];
    isLoading?: boolean;
    exceptionPage?: ExceptionPage;
    loader?: LoaderInterface | null;
}

const Content = ({ className, children, isLoading = false, loader, exceptionPage }: Props) => (
    <Wrapper className={className}>
        {!isLoading && children}
        {isLoading && exceptionPage && getExceptionPage(exceptionPage)}
        {isLoading && loader && (
            <Loading>
                <Row>
                    {loader.type === 'progress' && (
                        <LoaderWrapper>
                            <Loader size={30} />
                        </LoaderWrapper>
                    )}
                    <Title textAlign="center" type={loader.type}>
                        {<Translation>{loader.title}</Translation> || (
                            <Translation {...messages.TR_INITIALIZING_ACCOUNTS} />
                        )}
                    </Title>
                </Row>
                {loader.message && (
                    <Message>
                        <Translation>{loader.message}</Translation>
                    </Message>
                )}
            </Loading>
        )}
    </Wrapper>
);

export default Content;
