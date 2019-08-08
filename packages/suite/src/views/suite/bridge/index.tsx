import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Button, Select, P, Link, H1, colors, variables, Loader } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';
import { getRoute } from '@suite/utils/suite/router';
import { AppState } from '@suite-types';
import l10nMessages from './index.messages';

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
`;

const LoaderWrapper = styled.div`
    margin: 24px;
    align-items: center;
    justify-items: center;
`;

interface BridgeProps {
    transport: AppState['suite']['transport'];
}

interface Installer {
    label: string;
    value: string;
    signature: string;
    preferred: boolean;
}

const TREZOR_DATA_URL = 'https://wallet.trezor.io/data/';

const InstallBridge = (props: BridgeProps) => {
    const [selectedTarget, setSelectedTarget] = useState<Installer | null>(null);

    const onChange = (value: Installer) => {
        setSelectedTarget(value);
    };

    // todo: typescript any. use type from connect?
    const installers = props.transport
        ? props.transport.bridge.packages.map((p: any) => ({
              label: p.name,
              value: p.url,
              signature: p.signature,
              preferred: p.preferred,
          }))
        : [];

    const preferredTarget = installers.find((i: Installer) => i.preferred === true);
    const data = {
        currentVersion:
            props.transport && props.transport.type === 'bridge'
                ? `Your version ${props.transport!.version}`
                : 'Not installed',
        latestVersion: props.transport ? props.transport.bridge.version.join('.') : null,
        installers,
        target: preferredTarget || installers[0],
        uri: TREZOR_DATA_URL,
    };

    const target = selectedTarget || data.target;

    return (
        <Wrapper>
            <Top>
                <TitleHeader>
                    Trezor Bridge<Version>{data && data.currentVersion}</Version>
                </TitleHeader>
                <P>
                    <FormattedMessage {...l10nMessages.TR_NEW_COMMUNICATION_TOOL} />
                </P>

                {!props.transport ? (
                    <LoaderWrapper>
                        <CenteredLoader size={50} strokeWidth={2} />
                        <P>Gathering information, please wait...</P>
                    </LoaderWrapper>
                ) : (
                    <Download>
                        <SelectWrapper
                            isSearchable={false}
                            isClearable={false}
                            value={target}
                            onChange={(v: Installer) => onChange(v)}
                            options={installers}
                        />

                        <Link href={`${data.uri}${target.value}`}>
                            <DownloadBridgeButton icon="DOWNLOAD">
                                <FormattedMessage
                                    {...l10nMessages.TR_DOWNLOAD_LATEST_BRIDGE}
                                    values={{ version: data.latestVersion }}
                                />
                            </DownloadBridgeButton>
                        </Link>
                    </Download>
                )}

                <P size="small">
                    <LearnMoreText>
                        <FormattedMessage
                            {...l10nMessages.TR_LEARN_MORE_ABOUT_LATEST_VERSION}
                            values={{
                                TR_CHANGELOG: (
                                    <Link
                                        href="https://github.com/trezor/trezord-go/blob/master/CHANGELOG.md"
                                        isGreen
                                    >
                                        <FormattedMessage {...l10nMessages.TR_CHANGELOG} />
                                    </Link>
                                ),
                            }}
                        />
                    </LearnMoreText>
                </P>

                <P>
                    {target && data && target.signature && (
                        <Link href={data.uri + target.signature} isGreen>
                            <FormattedMessage {...l10nMessages.TR_CHECK_PGP_SIGNATURE} />
                        </Link>
                    )}
                </P>
            </Top>

            <Bottom>
                {props.transport && props.transport.type && (
                    <P>
                        <FormattedMessage {...l10nMessages.TR_DONT_UPGRADE_BRIDGE} />
                        <br />
                        <GoBack onClick={() => goto(getRoute('wallet-index'))}>
                            <FormattedMessage {...l10nMessages.TR_TAKE_ME_BACK_TO_WALLET} />
                        </GoBack>
                    </P>
                )}
            </Bottom>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
    }),
)(InstallBridge);
