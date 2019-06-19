import React from 'react';
import { connect } from 'react-redux';
import { State } from '@suite-types/index';
import TopNavigation from '@wallet-components/TopNavigation';

interface Props {
    children: React.ReactNode;
}

const Layout = (props: Props) => (
    <Layout>
        <TopNavigation />
        {props.children}
    </Layout>
);

const mapStateToProps = (state: State) => ({
    router: state.router,
    suite: state.suite,
});

export default connect(mapStateToProps)(Layout);
