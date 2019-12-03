import React from 'react';
import WalletLayout from '@wallet-components/WalletLayout';

interface Props {
    children: React.ReactNode;
    title: string;
}

const LayoutAccount = (props: Props) => (
    <WalletLayout title={props.title}>{props.children}</WalletLayout>
);

export default LayoutAccount;
