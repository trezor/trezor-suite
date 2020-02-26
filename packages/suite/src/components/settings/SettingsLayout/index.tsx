import React from 'react';
import styled from 'styled-components';
import { SuiteLayout } from '@suite-components';
import { Menu } from '@settings-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0px 32px 32px 32px;
    padding-top: 16px;
    max-width: 1024px;
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
};

const SettingsLayout = (props: Props) => {
    const title = props.title || 'Trezor Suite | Settings';

    return (
        <SuiteLayout title={title} secondaryMenu={<Menu />}>
            <Wrapper>{props.children}</Wrapper>
        </SuiteLayout>
    );
};

export default SettingsLayout;
