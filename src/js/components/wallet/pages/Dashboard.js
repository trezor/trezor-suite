/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import DashboardImg from '~/images/dashboard.png';

const Dashboard = () => (
    <section className="dashboard">
        <h2>Dashboard</h2>
        <div className="row">
            <h2>Please select your coin</h2>
            <p>You will gain access to recieving &amp; sending selected coin</p>
            <img src={DashboardImg} height="34" width="auto" alt="Dashboard" />
        </div>
    </section>
);

export default connect(null, null)(Dashboard);
