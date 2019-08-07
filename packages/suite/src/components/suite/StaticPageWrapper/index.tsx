import React from 'react';
import Layout from '@suite-components/Layout';
import { View, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
}

const StaticPageWrapper: React.FunctionComponent<Props> = props => {
    return (
        <Layout fullscreenMode>{props.children}</Layout>
    );
};

export default StaticPageWrapper;
