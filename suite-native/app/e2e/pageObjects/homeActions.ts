class HomeActions {
    async tapSyncCoinsButton() {
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@home/portfolio/sync-coins-button')).tap();
    }
}

export const onHome = new HomeActions();
