export const tapAddAccountButton = async () => {
    await element(by.id('@screen/mainScrollView')).scrollTo('top');
    await element(by.id('@myAssets/addAccountButton')).tap();
};

export const navigateToMyAssets = async () => {
    await element(by.id('@tabBar/AccountsStack')).tap();
};
