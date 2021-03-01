import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Translation, Image, TrezorLink, Modal, Metadata } from '@suite-components';
import { Button, P, Link, Select, useTheme, variables, Loader } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { URLS } from '@suite-constants';
import { AppState, Dispatch } from '@suite-types';
import { isDesktop, isWeb } from '@suite-utils/env';
import { useSelector } from '@suite-hooks';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    flex: 1;
    padding: 0px 74px;
    /* min-width: 560px; */

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0px;
        min-width: 0px;
    }
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

const BridgeDesktopNote = styled(P)`
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledImage = styled(Image)`
    @media screen and (max-height: ${variables.SCREEN_SIZE.LG}) {
        /* workaround for low height screens => hide image */
        display: none;
    }
`;

const Col = styled.div<{ justify?: string }>`
    display: flex;
    flex: 1;
    justify-content: ${props => props.justify};
`;

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

interface Installer {
    label: string;
    value: string;
    signature?: string;
    preferred?: boolean;
}

const InstallBridge = (props: Props) => {
    const tor = useSelector(state => state.suite.tor);
    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);
    const theme = useTheme();

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
    const isLoading = !props.transport;
    const transportAvailable = props.transport && props.transport.type;

    return (
        <Modal
            heading={<Translation id="TR_TREZOR_BRIDGE_DOWNLOAD" />}
            description={<Translation id="TR_NEW_COMMUNICATION_TOOL" />}
            data-test="@bridge"
        >
            <Metadata title="Download Bridge | Trezor Suite" />
            <Content>
                <Version show={!!data.currentVersion}>
                    <Translation
                        id="TR_CURRENTLY_INSTALLED_TREZOR"
                        values={{ version: data.currentVersion }}
                    />
                    {isDesktop() && (
                        <BridgeDesktopNote>
                            <Translation id="TR_OUTDATED_BRIDGE_DESKTOP" />
                        </BridgeDesktopNote>
                    )}
                </Version>
                <StyledImage image="T_BRIDGE_CHECK" />
                {isLoading ? (
                    <LoaderWrapper data-test="@bridge/loading">
                        <CenteredLoader size={50} strokeWidth={2} />
                        <P>
                            <Translation id="TR_GATHERING_INFO" />
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
                            maxMenuHeight={160}
                            data-test="@bridge/installers"
                        />

                        <TrezorLink variant="nostyle" href={`${data.uri}${target.value}`}>
                            <DownloadBridgeButton data-test="@bridge/download-button">
                                <Translation
                                    id="TR_DOWNLOAD_LATEST_BRIDGE"
                                    values={{ version: data.latestVersion }}
                                />
                            </DownloadBridgeButton>
                        </TrezorLink>
                    </Download>
                )}
                {isWeb() && tor && (
                    <P>
                        <TrezorLink href={URLS.WIKI_TOR}>
                            <Translation id="TR_TOR_BRIDGE" />
                        </TrezorLink>
                    </P>
                )}
            </Content>

            <Footer>
                {transportAvailable && (
                    <Col justify="flex-start">
                        <Button
                            icon="ARROW_LEFT"
                            variant="tertiary"
                            color={theme.TYPE_LIGHT_GREY}
                            onClick={() => props.goto('wallet-index')}
                            data-test="@bridge/goto/wallet-index"
                        >
                            <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                        </Button>
                    </Col>
                )}
                {!isLoading && (
                    <>
                        <Col justify="center">
                            <Link variant="nostyle" href={URLS.BRIDGE_CHANGELOG_URL}>
                                <Button
                                    icon="LOG"
                                    color={theme.TYPE_LIGHT_GREY}
                                    variant="tertiary"
                                    onClick={() => {}}
                                >
                                    <Translation id="TR_CHANGELOG" />
                                </Button>
                            </Link>
                        </Col>
                        <Col justify="flex-end">
                            {data && target?.signature && (
                                <TrezorLink variant="nostyle" href={data.uri + target.signature}>
                                    <Button
                                        color={theme.TYPE_LIGHT_GREY}
                                        icon="SIGNATURE"
                                        variant="tertiary"
                                        onClick={() => {}}
                                    >
                                        <Translation id="TR_CHECK_PGP_SIGNATURE" />
                                    </Button>
                                </TrezorLink>
                            )}
                        </Col>
                    </>
                )}
            </Footer>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(InstallBridge);
