import React, { useState } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { H2, Button, P, Select, Link } from '@trezor/components';

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

export default () => {
    const [app, setApp] = useState<string | null>(null);

    return (
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
                        onChange={(option: { value: string | null; label: string | null }) =>
                            setApp(option.value)
                        }
                    />
                    <Item>
                        {app && (
                            <Link
                                href={`https://wallet.trezor.io/${app}`}
                                target="_blank"
                                variant="nostyle"
                            >
                                <ButtonDownload isDisabled={app === null} variant="primary">
                                    Download
                                </ButtonDownload>
                            </Link>
                        )}
                        {!app && (
                            <ButtonDownload isDisabled variant="primary">
                                Download
                            </ButtonDownload>
                        )}
                    </Item>
                </Row>
                <Item>
                    <ButtonContinue variant="tertiary" icon="ARROW_RIGHT" alignIcon="right">
                        <Link href="https://wallet.trezor.io/" target="_blank" variant="nostyle">
                            Continue in browser
                        </Link>
                    </ButtonContinue>
                </Item>
            </Wrapper>
        </Layout>
    );
};
