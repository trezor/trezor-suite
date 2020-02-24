import React, { useState } from 'react';
import Head from 'next/head';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Button, P, Link, H2, Select, colors, variables, Loader } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { URLS } from '@suite-constants';
import { AppState, Dispatch } from '@suite-types';
import messages from '@suite/support/messages';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 780px;
    justify-content: center;
    padding: 50px 0px 30px 0px;
    flex: 1;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    flex: 1;
    padding: 0px 110px;
    /* min-width: 560px; */

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0px;
        min-width: 0px;
    }
`;

const Description = styled(P)`
    color: ${colors.BLACK50};
`;

const Footer = styled.div`
    margin-top: 72px;
    display: flex;
    padding: 0px 42px;
    justify-content: space-between;
    width: 100%;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0px 12px;
    }
`;

const TitleHeader = styled(H2)`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
`;

const SelectWrapper = styled(Select)`
    width: 100%;
`;

const Download = styled.div`
    margin: 24px auto;
    display: flex;
    justify-content: center;
    align-content: center;
    flex-direction: column;
`;

const DownloadBridgeButton = styled(Button)`
    margin-top: 12px;
    min-width: 280px;
`;

const CenteredLoader = styled(Loader)`
    margin: 0 auto;
    margin-bottom: 10px;
`;

const LoaderWrapper = styled.div`
    margin: 15px 0 25px 0;
    align-items: center;
    /* same height as content so it won't feel jumpy */
    min-height: 98px;
    justify-items: center;
`;

const Version = styled.div<{ show: boolean }>`
    visibility: ${props => (props.show ? 'visible' : 'hidden')};
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Image = styled.img``;

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

interface Installer {
    label: string;
    value: string;
    signature?: string;
    preferred?: boolean;
}

const InstallBridge = (props: Props) => {
    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);

    const installers: Installer[] =
        props.transport && props.transport.bridge
            ? props.transport.bridge.packages.map(p => ({
                  label: p.name,
                  value: p.url,
                  signature: p.signature,
                  preferred: p.preferred,
              }))
            : [];

    const preferredTarget = installers.find(i => i.preferred === true);
    const data = {
        currentVersion: props.transport?.type === 'bridge' ? props.transport!.version : null,
        latestVersion: props.transport?.bridge ? props.transport.bridge.version.join('.') : null,
        installers,
        target: preferredTarget || installers[0],
        uri: URLS.TREZOR_DATA_URL,
    };

    const target = selectedTarget || data.target;
    const isLoading = !props.transport || process.env.SUITE_TYPE === 'desktop';

    return (
        <Wrapper>
            <Head>
                <title>Download Bridge | Trezor Suite</title>
            </Head>
            <Content>
                <TitleHeader>Trezor Bridge Download</TitleHeader>
                <Description size="small">
                    <Translation {...messages.TR_NEW_COMMUNICATION_TOOL} />
                </Description>
                <Version show={!!data.currentVersion}>
                    Currently installed: Trezor Bridge {data.currentVersion}
                </Version>
                <Image src={resolveStaticPath('images/suite/t-bridge-check.svg')} />
                {isLoading ? (
                    <LoaderWrapper>
                        <CenteredLoader size={50} strokeWidth={2} />
                        <P>
                            <Translation {...messages.TR_GATHERING_INFO} />
                        </P>
                    </LoaderWrapper>
                ) : (
                    <Download>
                        <SelectWrapper
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            onChange={setSelectedTarget}
                            options={installers}
                        />

                        <Link variant="nostyle" href={`${data.uri}${target.value}`}>
                            <DownloadBridgeButton>
                                <Translation
                                    {...messages.TR_DOWNLOAD_LATEST_BRIDGE}
                                    values={{ version: data.latestVersion }}
                                />
                            </DownloadBridgeButton>
                        </Link>
                    </Download>
                )}
            </Content>

            <Footer>
                <Button
                    icon="ARROW_LEFT"
                    variant="tertiary"
                    color={colors.BLACK50}
                    onClick={() => props.goto('wallet-index')}
                >
                    <Translation {...messages.TR_TAKE_ME_BACK_TO_WALLET} />
                </Button>
                {!isLoading && (
                    <>
                        <Link variant="nostyle" href={URLS.BRIDGE_CHANGELOG_URL}>
                            <Button
                                icon="LOG"
                                color={colors.BLACK50}
                                variant="tertiary"
                                onClick={() => {}}
                            >
                                <Translation {...messages.TR_CHANGELOG} />
                            </Button>
                        </Link>

                        {data && target?.signature && (
                            <Link variant="nostyle" href={data.uri + target.signature}>
                                <Button
                                    color={colors.BLACK50}
                                    icon="SIGN"
                                    variant="tertiary"
                                    onClick={() => {}}
                                >
                                    <Translation {...messages.TR_CHECK_PGP_SIGNATURE} />
                                </Button>
                            </Link>
                        )}
                    </>
                )}
            </Footer>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(InstallBridge);
