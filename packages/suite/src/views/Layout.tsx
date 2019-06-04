import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchLocale } from '@suite/actions/languageActions.nonNativeOnly';
import { LANGUAGES } from '@suite/config/app';
import { Header as AppHeader, LanguagePicker, colors } from '@trezor/components';
import Router from '@suite/support/Router';
import { State } from '@suite/types';
import DeviceSelection from '../components/DeviceSelection';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
`;

const AppWrapper = styled.div`
    width: 100%;
    max-width: 1170px;
    margin: 0 auto;
    flex: 1;
    background: ${colors.WHITE};
    display: flex;
    flex-direction: column;
    border-radius: 4px 4px 0px 0px;
    margin-top: 10px;

    @media screen and (max-width: 1170px) {
        border-radius: 0px;
        margin-top: 0px;
    }
`;

const SuiteHeader = styled.div`
    display: flex;
    padding: 10px;
    border-radius: 4px 4px 0px 0px;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    background: ${colors.WHITE};
    max-width: 1170px;
    margin: 10px auto;
    height: 80px;
    flex-direction: row;
`;

interface Props {
    router: State['router'];
    suite: State['suite'];
    devices: State['devices'];
    fetchLocale: typeof fetchLocale;
}

const Layout = (props: Props) => (
    <Wrapper>
        <Router />
        <AppHeader
            sidebarEnabled={false}
            rightAddon={
                <LanguagePicker
                    language={props.suite.language}
                    languages={LANGUAGES}
                    onChange={option => {
                        props.fetchLocale(option.value);
                    }}
                />
            }
        />
        <SuiteHeader>
            <DeviceSelection data-test="@suite/device_selection" />
        </SuiteHeader>
        <AppWrapper />
    </Wrapper>
);

const mapStateToProps = (state: State) => ({
    router: state.router,
    suite: state.suite,
    devices: state.devices,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        fetchLocale: bindActionCreators(fetchLocale, dispatch),
    }),
)(Layout);
