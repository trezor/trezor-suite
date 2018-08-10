/* @flow */


import React from 'react';
import { H2 } from '~/js/components/common/Heading';
import { connect } from 'react-redux';
import DashboardImg from '~/images/dashboard.png';

const Dashboard = () => (
    <section className="dashboard">
        <H2>Dashboard</H2>
        <div className="row">
            <H2>Please select your coin</H2>
            <p>You will gain access to recieving &amp; sending selected coin</p>
            <img src={DashboardImg} height="34" width="auto" alt="Dashboard" />
        </div>
    </section>
);

export default connect(null, null)(Dashboard);
