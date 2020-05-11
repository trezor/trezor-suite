import React, { useState } from 'react';
import styled from 'styled-components';
import { join } from 'path';
import { resolveStaticPath } from '@suite-utils/nextjs';
import Layout from '../components/Layout';
import { H2, Button, P, Select, Link, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Item = styled.div`
    display: flex;
`;

const Row = styled.div`
    margin: 30px 0 0 0;
    display: flex;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: row;
    }
`;

const ButtonContinue = styled(Button)`
    margin: 60px 0 0 0;
`;

const ButtonDownload = styled(Button)`
    margin: 30px 0 0 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin: 30px 0 0 0;
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 30px 0 0 20px;
    }
`;

type App = 'win' | 'macos' | 'linux';

const getAppUrl = (appName: App) => {
    const appsRoot = resolveStaticPath('/apps');
    switch (appName) {
        case 'win':
            return join(appsRoot, 'Trezor-Beta-Wallet.exe');
        case 'macos':
            return join(appsRoot, 'Trezor-Beta-Wallet.zip');
        case 'linux':
            return join(appsRoot, 'Trezor-Beta-Wallet.AppImage');
        // no default
    }
};

export default () => {
    const [app, setApp] = useState<App | null>(null);

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
                        onChange={(option: { value: App | null; label: string | null }) =>
                            setApp(option.value)
                        }
                    />
                    <Item>
                        {app && (
                            <Link href={getAppUrl(app)} variant="nostyle">
                                <ButtonDownload variant="primary">Download</ButtonDownload>
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
