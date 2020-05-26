import React, { useState } from 'react';
import styled from 'styled-components';
import Layout from '@landing-components/Layout';
import { Translation } from '@suite-components';
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

const normalizeVersion = (version: string) => {
    const normalizedVersion = version.toUpperCase();
    // remove any zeros that are not preceded by Latin letters, decimal digits, underscores
    return normalizedVersion.replace(/\b0+/g, '');
};

const getAppUrl = (appName: App) => {
    const ghRepo = 'https://github.com/trezor/trezor-suite';
    const version = process.env.VERSION ? normalizeVersion(process.env.VERSION) : '5.17.2020-BETA';
    const url = `${ghRepo}/releases/download/v${version}`;
    switch (appName) {
        case 'win':
            return `${url}/Trezor-Beta-Wallet-${version}.exe`;
        case 'macos':
            return `${url}/Trezor-Beta-Wallet-${version}.dmg`;
        case 'linux':
            return `${url}/Trezor-Beta-Wallet-${version}.AppImage`;
        // no default
    }
};

export default () => {
    const [app, setApp] = useState<App | null>(null);

    return (
        <Layout>
            <Wrapper>
                <H2>
                    <Translation id="TR_LANDING_TITLE" />
                </H2>
                <P size="tiny">
                    <Translation id="TR_LANDING_DESC" />
                </P>
                <Row>
                    <Select
                        variant="small"
                        topLabel={<Translation id="TR_LANDING_CHOOSE_LABEL" />}
                        width={240}
                        isSearchable={false}
                        defaultValue={{
                            label: <Translation id="TR_LANDING_CHOOSE_VALUE" />,
                            value: null,
                        }}
                        options={[
                            { label: <Translation id="TR_LANDING_WINDOWS" />, value: 'win' },
                            { label: <Translation id="TR_LANDING_MACOS" />, value: 'macos' },
                            { label: <Translation id="TR_LANDING_LINUX" />, value: 'linux' },
                        ]}
                        onChange={(option: { value: App | null; label: string | null }) =>
                            setApp(option.value)
                        }
                    />
                    <Item>
                        {app && (
                            <Link href={getAppUrl(app)} variant="nostyle">
                                <ButtonDownload variant="primary">
                                    <Translation id="TR_LANDING_DOWNLOAD" />
                                </ButtonDownload>
                            </Link>
                        )}
                        {!app && (
                            <ButtonDownload isDisabled variant="primary">
                                <Translation id="TR_LANDING_DOWNLOAD" />
                            </ButtonDownload>
                        )}
                    </Item>
                </Row>
                <Item>
                    <ButtonContinue variant="tertiary" icon="ARROW_RIGHT" alignIcon="right">
                        <Link href="../" variant="nostyle">
                            <Translation id="TR_LANDING_CONTINUE" />
                        </Link>
                    </ButtonContinue>
                </Item>
            </Wrapper>
        </Layout>
    );
};
