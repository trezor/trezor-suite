import React from 'react';
// import styled from 'styled-components';

export default () => {
    return <>changelog</>;
};

// const ChangeLog = ({
//     firmwareRelease,
//     isLatest,
//     currentVersion,
// }: {
//     firmwareRelease?: FirmwareRelease;
//     isLatest?: boolean;
//     currentVersion?: string;
// }) => {
//     if (isLatest) {
//         return (
//             <ChangelogWrapper>
//                 <H2>{currentVersion}</H2>
//                 <P>Latest firmware already installed</P>
//             </ChangelogWrapper>
//         );
//     }
//     if (!firmwareRelease) {
//         return (
//             <ChangelogWrapper>
//                 <H2>Changelog</H2>
//                 <P>Connect your device to see changelog</P>
//             </ChangelogWrapper>
//         );
//     }
//     return (
//         <ChangelogWrapper>
//             <H2>Changelog</H2>
//             <P>{firmwareRelease.version.join('.')}</P>
//             {firmwareRelease.changelog.split('*').map((row: string) => (
//                 <P key={row.substr(0, 8)}>{row}</P>
//             ))}
//         </ChangelogWrapper>
//     );
// };
