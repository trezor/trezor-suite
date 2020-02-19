import React, { useState } from 'react';
import Head from 'next/head';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { Select, colors, variables, Loader } from '@trezor/components';
import { Button, P, Link, H1 } from '@trezor/components-v2';
import * as routerActions from '@suite-actions/routerActions';
import { URLS } from '@suite-constants';
import { AppState, Dispatch } from '@suite-types';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px 30px 24px;
    flex: 1;
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 500px;
    text-align: center;
    flex: 1;
    padding-top: 30px;
`;

const Bottom = styled.div`
    padding-bottom: 20px;
`;

const TitleHeader = styled(H1)`
    display: flex;
    font-size: ${variables.FONT_SIZE.HUGE};
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
`;

const Version = styled.span`
    color: ${colors.GREEN_PRIMARY};
    padding: 6px 10px;
    border: 1px solid ${colors.GREEN_PRIMARY};
    border-radius: 3px;
    font-size: ${variables.FONT_SIZE.BASE};
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    margin-left: 24px;
`;

const LearnMoreText = styled.span`
    margin-right: 4px;
`;

const SelectWrapper = styled(Select)`
    margin-right: 10px;
    width: 180px;
    margin-bottom: 5px;
`;

const Download = styled.div`
    margin: 24px auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`;

const DownloadBridgeButton = styled(Button)``;

const GoBack = styled(Link)`
    display: flex;
    justify-content: center;
`;

const CenteredLoader = styled(Loader)`
    margin: 0 auto;
    margin-bottom: 10px;
`;

const LoaderWrapper = styled.div`
    margin: 15px 0 25px 0;
    align-items: center;
    justify-items: center;
`;

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
        currentVersion:
            props.transport && props.transport.type === 'bridge'
                ? `Your version ${props.transport!.version}`
                : 'Not installed',
        latestVersion:
            props.transport && props.transport.bridge
                ? props.transport.bridge.version.join('.')
                : null,
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
            <Top>
                <TitleHeader>
                    Trezor Bridge
                    {isLoading && (
                        <Version>
                            <Translation {...messages.TR_VERSION_IS_LOADING} />
                        </Version>
                    )}
                    {props.transport && <Version>{data && data.currentVersion}</Version>}
                </TitleHeader>
                <P>
                    <Translation {...messages.TR_NEW_COMMUNICATION_TOOL} />
                </P>
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

                        <Link href={`${data.uri}${target.value}`}>
                            <DownloadBridgeButton icon="RECEIVE">
                                <Translation
                                    {...messages.TR_DOWNLOAD_LATEST_BRIDGE}
                                    values={{ version: data.latestVersion }}
                                />
                            </DownloadBridgeButton>
                        </Link>
                    </Download>
                )}

                <P size="small">
                    <LearnMoreText>
                        <Translation
                            {...messages.TR_LEARN_MORE_ABOUT_LATEST_VERSION}
                            values={{
                                TR_CHANGELOG: (
                                    <Link href={URLS.BRIDGE_CHANGELOG_URL}>
                                        <Translation {...messages.TR_CHANGELOG} />
                                    </Link>
                                ),
                            }}
                        />
                    </LearnMoreText>
                </P>

                <P>
                    {target && data && target.signature && (
                        <Link href={data.uri + target.signature}>
                            <Translation {...messages.TR_CHECK_PGP_SIGNATURE} />
                        </Link>
                    )}
                </P>
            </Top>

            <Bottom>
                {props.transport &&
                    props.transport.type &&
                    props.device &&
                    props.device.type !== 'unreadable' && (
                        <P>
                            <Translation {...messages.TR_DONT_UPGRADE_BRIDGE} />
                            <GoBack onClick={() => props.goto('wallet-index')}>
                                <Translation {...messages.TR_TAKE_ME_BACK_TO_WALLET} />
                            </GoBack>
                        </P>
                    )}
            </Bottom>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(InstallBridge);
