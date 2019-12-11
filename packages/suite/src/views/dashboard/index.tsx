import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import SuiteLayout from '@suite-components/SuiteLayout';
import AssetsCard from '@suite/components/suite/AssetsCard';
import { Props } from './Container';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    padding: 30px 50px;
`;

const Dashboard = (props: Props) => {
    const discovery = props.getDiscoveryForDevice();
    const { device } = props;
    const accounts = device
        ? sortByCoin(
              props.accounts.filter(a => a.deviceState === device.state && (!a.empty || a.visible)),
          )
        : [];
    const groupedAssets: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!groupedAssets[a.symbol]) {
            groupedAssets[a.symbol] = [];
        }
        groupedAssets[a.symbol].push(a);
    });

    const isLoading = !discovery || accounts.length < 1;
    console.log(groupedAssets);
    return (
        <SuiteLayout>
            <Wrapper>
                <AssetsCard
                    assets={groupedAssets}
                    localCurrency={props.localCurrency}
                    rates={props.fiat}
                />
            </Wrapper>
        </SuiteLayout>
    );
};

export default connect()(Dashboard);
