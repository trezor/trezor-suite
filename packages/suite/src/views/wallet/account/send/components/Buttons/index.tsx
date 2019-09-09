import React from 'react';
import styled from 'styled-components';
import { injectIntl, InjectedIntl } from 'react-intl';

const Wrapper = styled.div`
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left: 0px;
    height: 40px;
    padding: 0 10px;
`;

interface Props {
    intl: InjectedIntl;
}

const Buttons = (props: Props) => <Wrapper />;

export default injectIntl(Buttons);
