import React, { useState } from 'react';
import styled from 'styled-components';
import Layout from '@landing-components/StartLayout';
import { normalizeVersion } from '@suite-utils/build';
import { SL_SIGNING_KEY } from '@suite-constants/urls';
import { H2, Button, P, Select, Link, colors, variables } from '@trezor/components';

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

const StyledLink = styled(Link)`
    font-weight: 400;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.TYPE_LIGHT_GREY};
    text-decoration: underline;

    & + & {
        margin-left: 8px;
    }
`;

const Signatures = styled.div`
    display: flex;
    height: 16px;
    color: ${colors.TYPE_LIGHT_GREY};
    margin: 8px 4px;
`;

type Platform = 'win' | 'mac' | 'linux-x86_64' | 'linux-arm64';

const getAppUrl = (platform: Platform) => {
    const version = process.env.VERSION ? normalizeVersion(process.env.VERSION) : '';
    let ext = '';
    if (platform.startsWith('linux-')) {
        ext = 'AppImage';
    } else if (platform.startsWith('mac')) {
        ext = 'dmg';
    } else {
        ext = 'exe';
    }
    return encodeURI(`../web/static/desktop/Trezor-Suite-${version}-${platform}.${ext}`);
};

const getAppSignatureUrl = (platform: Platform) => {
    const installer = getAppUrl(platform);
    return encodeURI(`${installer}.asc`);
};

const Start = () => {
    const [platform, setPlatform] = useState<Platform | null>(null);

    return (
        <Layout>
            <Wrapper>
                <H2>Download Trezor Suite desktop app</H2>
                <P size="tiny">
                    For testing purposes only. Please keep in mind this is a beta version.
                </P>
                <Row>
                    <Select
                        variant="small"
                        topLabel="Choose your platform"
                        width={240}
                        isSearchable={false}
                        defaultValue={{
                            label: '– Click to choose –',
                            value: null,
                        }}
                        options={[
                            { label: 'Windows', value: 'win' },
                            { label: 'Linux (x86_64)', value: 'linux-x86_64' },
                            { label: 'Linux (arm64)', value: 'linux-arm64' },
                            { label: 'macOS', value: 'mac' },
                        ]}
                        onChange={(option: { value: Platform | null; label: string | null }) =>
                            setPlatform(option.value)
                        }
                    />
                    <Item>
                        {platform && (
                            <Link href={getAppUrl(platform)} variant="nostyle">
                                <ButtonDownload variant="primary">Download</ButtonDownload>
                            </Link>
                        )}
                        {!platform && (
                            <ButtonDownload isDisabled variant="primary">
                                Download
                            </ButtonDownload>
                        )}
                    </Item>
                </Row>
                <Signatures>
                    {platform && (
                        <>
                            <StyledLink href={SL_SIGNING_KEY}>Signing key</StyledLink>
                            <StyledLink href={getAppSignatureUrl(platform)}>Signature</StyledLink>
                        </>
                    )}
                </Signatures>
                <Item>
                    <Link href="../web" variant="nostyle" target="_self">
                        <ButtonContinue
                            onClick={() => {}}
                            variant="tertiary"
                            icon="ARROW_RIGHT"
                            alignIcon="right"
                        >
                            Continue in browser
                        </ButtonContinue>
                    </Link>
                </Item>
            </Wrapper>
        </Layout>
    );
};

export default Start;
