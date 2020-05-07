import React from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { H2, Button, P, Select } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Item = styled.div``;
const Row = styled.div`
    margin: 30px 0 0 0;
    display: flex;
`;

const ButtonContinue = styled(Button)`
    margin: 60px 0 0 0;
`;

const ButtonDownload = styled(Button)`
    margin: 30px 0 0 20px;
`;

const Index = () => (
    <Layout>
        <Wrapper>
            <H2>Download Trezor Suite (beta) desktop app</H2>
            <P size="tiny">
                For testing purpouses only. Please keep in mind this is a beta version.
            </P>
            <Row>
                <Select
                    variant="small"
                    topLabel="Choose your platform"
                    width={240}
                    isSearchable={false}
                    defaultValue={{ label: '– Click to choose –', value: null }}
                    options={[
                        { label: 'Windows', value: 'win' },
                        { label: 'Mac OS', value: 'macos' },
                        { label: 'Linux', value: 'linux' },
                    ]}
                />
                <Item>
                    <ButtonDownload variant="primary">Download</ButtonDownload>
                </Item>
            </Row>
            <Item>
                <ButtonContinue variant="tertiary" icon="ARROW_RIGHT" alignIcon="right">
                    Continue in browser
                </ButtonContinue>
            </Item>
        </Wrapper>
    </Layout>
);

export default Index;
