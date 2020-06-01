export const getLinuxPackage = () => {
    if (typeof navigator === 'undefined' || navigator.appVersion.includes('Linux')) return;
    return navigator.appVersion.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/)
        ? 'rpm'
        : 'deb';
};
