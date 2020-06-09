export const getLinuxPackage = () => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.appVersion.includes('Linux') || navigator.appVersion.includes('Android')) return;
    return navigator.appVersion.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/)
        ? 'rpm'
        : 'deb';
};
