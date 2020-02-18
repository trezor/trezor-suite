import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

interface Props {
    children: React.ReactNode;
    ['data-test']?: string;
}
export default ({ children, ...props }: Props) => <Scrollbars {...props}>{children}</Scrollbars>;
