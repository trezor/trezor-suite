import React from 'react';
import { connect } from 'react-redux';
import { Text, ScrollView, View } from 'react-native';
import Head from '@suite-support/Head';
import { AppState, SuiteThemeColors } from '@suite-types';
import { useTheme } from '@suite-hooks';

const styles = (theme: SuiteThemeColors) => ({
    wrapper: { backgroundColor: theme.BG_WHITE },
});

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
});

type Props = ReturnType<typeof mapStateToProps> & {
    title: string;
    disableTabs?: boolean;
    children: React.ReactNode;
};

const Layout = (props: Props) => {
    const {
        title,
        suite,
        // router,
    } = props;
    const { theme } = useTheme();

    // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    if (!suite.transport) {
        return (
            <View>
                <Head title={`${title}: Loading transport`} disableTabs={props.disableTabs} />
                <Text>Loading transport...</Text>
            </View>
        );
    }

    // no available transport - but this should not happen
    if (!suite.transport.type) {
        return (
            <View>
                <Head title={`${title}: Loading transport`} disableTabs={props.disableTabs} />
                <Text>No transport</Text>
            </View>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO: render "connect device" view
        return (
            <View>
                <Head title={`${title}: Connect Trezor`} disableTabs={props.disableTabs} />
                <Text>Connect Trezor to continue</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </View>
        );
    }

    // connected device is in unexpected mode
    if (suite.device.type !== 'acquired') {
        // TODO: render "acquire device" or "unreadable device" page
        return (
            <View>
                <Head title={`${title}: unacquired`} disableTabs={props.disableTabs} />
                <Text>unacquired</Text>
                {/* <AcquireDevice /> */}
            </View>
        );
    }

    if (suite.device.mode !== 'normal') {
        // TODO: render "unexpected mode" page (bootloader, seedless, not initialized)
        // not-initialized should redirect to onboarding
        return (
            <View>
                <Head title={`${title}: unexpected mode`} disableTabs={props.disableTabs} />
                <Text>Device is in unexpected mode: {suite.device.mode}</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles(theme).wrapper}>
            <Head title={`${title}: OK`} />
            {props.children}
        </ScrollView>
    );
};

export default connect(mapStateToProps)(Layout);
