import React from 'react';
import Layout from '@suite-components/Layout';
import { View, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});

const StaticPageWrapper: React.FunctionComponent<Props> = props => {
    return (
        <Layout>
            <View style={styles.wrapper}>{props.children}</View>
        </Layout>
    );
};

export default StaticPageWrapper;
