module.exports = () => {
    // global.WsCacheServer is assigned in jest.globalSetup.js
    if (global.WsCacheServer) {
        global.WsCacheServer.close();
    }
};
