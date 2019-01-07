/* @flow */

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import styled from 'styled-components';
import { H1 } from 'components/Heading';
import P from 'components/Paragraph';
import colors from 'config/colors';
import Link from 'components/Link';
import Button from 'components/Button';

import { FONT_SIZE } from 'config/variables';
import * as deviceUtils from 'utils/device';

import * as RouterActions from 'actions/RouterActions';

import type {
    TrezorDevice,
    State,
    Dispatch,
} from 'flowtype';

type Props = {
    device: ?TrezorDevice;
}

const Wrapper = styled.section`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 90px 35px 40px 35px;
`;

const StyledNavLink = styled(Link)`
    color: ${colors.TEXT_SECONDARY};
    padding-top: 20px;
    font-size: ${FONT_SIZE.BASE};
`;

const Image = styled.div`
    padding-bottom: 30px;
`;

const StyledP = styled(P)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const FirmwareUpdate = (props: Props) => (
    <Wrapper>
        <Image>
            <svg width="181px" height="134px" viewBox="0 0 181 134" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <title>Chip</title>
                <defs>
                    <linearGradient x1="-18.9038234%" y1="84.5976591%" x2="72.6763662%" y2="84.5976587%" id="linearGradient-1">
                        <stop stopColor="#FFFFFF" offset="0%" />
                        <stop stopColor="#E8E8E8" offset="71.3377225%" />
                        <stop stopColor="#F5F5F5" offset="75.783547%" />
                        <stop stopColor="#EDEEEE" offset="80.9337916%" />
                        <stop stopColor="#DDDDDD" offset="100%" />
                    </linearGradient>
                    <linearGradient x1="50%" y1="100%" x2="50%" y2="3.061617e-15%" id="linearGradient-2">
                        <stop stopColor="#FFFFFF" offset="0%" />
                        <stop stopColor="#EDEEEE" offset="100%" />
                    </linearGradient>
                    <linearGradient x1="-18.9038234%" y1="84.5976591%" x2="72.6763662%" y2="84.5976587%" id="linearGradient-3">
                        <stop stopColor="#858585" offset="0%" />
                        <stop stopColor="#505050" offset="71.3377225%" />
                        <stop stopColor="#606060" offset="75.783547%" />
                        <stop stopColor="#2A2A2A" offset="80.9337916%" />
                        <stop stopColor="#202020" offset="100%" />
                    </linearGradient>
                    <linearGradient x1="50%" y1="100%" x2="50%" y2="3.061617e-15%" id="linearGradient-4">
                        <stop stopColor="#141313" offset="0%" />
                        <stop stopColor="#5B5B5B" offset="100%" />
                    </linearGradient>
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="97.3898121%" id="linearGradient-5">
                        <stop stopColor="#FFDA7F" offset="0%" />
                        <stop stopColor="#FF8007" offset="100%" />
                    </linearGradient>
                </defs>
                <g id="Styles" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g id="08-Connect-modals" transform="translate(-1141.000000, -3424.000000)">
                        <g id="Group-7-Copy-6" transform="translate(55.000000, 166.000000)">
                            <g id="Window-Copy-4" transform="translate(0.000000, 3045.000000)">
                                <g id="window-copy-14" transform="translate(693.000000, 0.000000)">
                                    <g id="CPU" transform="translate(379.000000, 209.000000)">
                                        <g id="Group">
                                            <g id="Group-2">
                                                <path
                                                    d="M21.8335471,60.1448964 L93.8285497,13.6856547 C101.059567,9.01939202 110.370641,9.09079236 117.529248,13.8673994 L186.744363,60.051444 C194.462353,65.2013017 196.544236,75.6327535 191.394378,83.3507436 C190.123073,85.2560229 188.475594,86.8812158 186.553178,88.1264547 L115.743016,133.993501 C108.5983,138.621466 99.4016995,138.621466 92.2569841,133.993501 L21.8093241,88.361264 C14.021914,83.3169951 11.7981586,72.9148639 16.8424276,65.1274538 C18.1348647,63.1321721 19.8360493,61.4339058 21.8335471,60.1448964 Z"
                                                    id="Path-29"
                                                    fill="url(#linearGradient-1)"
                                                />
                                                <path
                                                    d="M21.8335471,54.1448964 L93.8285497,7.68565469 C101.059567,3.01939202 110.370641,3.09079236 117.529248,7.86739936 L186.744363,54.051444 C194.462353,59.2013017 196.544236,69.6327535 191.394378,77.3507436 C190.123073,79.2560229 188.475594,80.8812158 186.553178,82.1264547 L115.743016,127.993501 C108.5983,132.621466 99.4016995,132.621466 92.2569841,127.993501 L21.8093241,82.361264 C14.021914,77.3169951 11.7981586,66.9148639 16.8424276,59.1274538 C18.1348647,57.1321721 19.8360493,55.4339058 21.8335471,54.1448964 Z"
                                                    id="Path-29"
                                                    fill="url(#linearGradient-2)"
                                                />
                                            </g>
                                            <g id="Group-2" transform="translate(31.260116, 16.800000)">
                                                <path
                                                    d="M15.2430528,41.4528673 L65.6068201,8.88594655 C70.6741421,5.6092442 77.2046046,5.65936263 82.2210382,9.01345336 L130.640608,41.3877741 C136.039791,44.9977792 137.490207,52.3011696 133.880202,57.700353 C132.993166,59.027019 131.845386,60.1592599 130.506752,61.0281312 L80.9718465,93.1799281 C75.9649846,96.4297497 69.5147842,96.4297497 64.5079223,93.1799281 L15.2260928,61.1923964 C9.77820645,57.6563175 8.22838031,50.3733748 11.7644592,44.9254885 C12.6664405,43.5358442 13.8518606,42.3524594 15.2430528,41.4528673 Z"
                                                    id="Path-29"
                                                    fill="url(#linearGradient-3)"
                                                />
                                                <path
                                                    d="M15.2430528,37.9656878 L65.6068201,5.39876706 C70.6741421,2.12206472 77.2046046,2.17218314 82.2210382,5.52627387 L130.640608,37.9005946 C136.039791,41.5105997 137.490207,48.8139901 133.880202,54.2131735 C132.993166,55.5398395 131.845386,56.6720804 130.506752,57.5409517 L80.9718465,89.6927487 C75.9649846,92.9425702 69.5147842,92.9425702 64.5079223,89.6927487 L15.2260928,57.7052169 C9.77820645,54.1691381 8.22838031,46.8861953 11.7644592,41.438309 C12.6664405,40.0486647 13.8518606,38.8652799 15.2430528,37.9656878 Z"
                                                    id="Path-29"
                                                    fill="url(#linearGradient-4)"
                                                />
                                            </g>
                                            <path
                                                d="M121.606605,64.9975648 L125.626327,67.5589431 L103.910719,82.8 L86.0383539,77.3254798 L79.3526012,62.5099845 L98.1471069,50.0491032 L102.168735,52.6116966 L105.034567,51.1344005 C109.861921,48.0738333 118.623742,46.4622394 123.729362,50.0491032 C128.834982,53.6359669 128.283618,59.272519 124.472437,62.6880754 L121.606605,64.9975648 Z M102.97286,76.2495098 L114.957457,67.2042987 L98.0545701,56.0419014 L86.6587496,64.0099213 L91.3919047,73.0510939 L102.97286,76.2495098 Z M110.020127,54.3112144 L107.154296,55.7885105 L117.139544,62.0684197 L119.486876,60.3434548 C121.761419,59.1709601 122.964194,55.7885105 119.486876,53.4790211 C116.009558,51.1695317 112.294669,53.1387197 110.020127,54.3112144 Z"
                                                id="Logotype"
                                                fill="url(#linearGradient-5)"
                                            />
                                        </g>
                                    </g>
                                </g>
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
        </Image>
        <H1>It’s time to update your firmware</H1>
        <StyledP>Please use Bitcoin wallet interface to update your firmware.</StyledP>
        <Link href="https://beta-wallet.trezor.io">
            <Button>Take me to the Bitcoin wallet</Button>
        </Link>
        {deviceUtils.isDeviceAccessible(props.device) && (
            <StyledNavLink to="/">I’ll do that later.</StyledNavLink>
        )}
    </Wrapper>
);

export default connect(
    (state: State) => ({
        device: state.wallet.selectedDevice,
    }),
    (dispatch: Dispatch) => ({
        cancel: bindActionCreators(RouterActions.selectFirstAvailableDevice, dispatch),
    }),
)(FirmwareUpdate);
