/* @flow */
'use strict';

import React from 'react';

const Dashboard = (props: any): any => {
    return (
        <section className="dashboard">
            <h2>Dashboard</h2>
            <div className="row">
                <h2>Please select your coin</h2>
                <p>You will gain access to recieving &amp; sending selected coin</p>
                <img src="./images/dashboard.png" height="34" width="auto" alt="Dashboard" />
            </div>
        </section>
    );
}

export default Dashboard;
