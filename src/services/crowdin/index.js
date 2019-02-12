const fs = require('fs');
const path = require('path');
const request = require('request-promise-native');
const extractZip = require('extract-zip');


/*
    Upload a new csv file to Crowdin service
    https://support.crowdin.com/api/add-file/
*/
const addFile = (filePath, scheme, projectId, apiKey) => {
    const newMasterCsv = fs.createReadStream(filePath);
    const params = {
        method: 'POST',
        uri: `https://api.crowdin.com/api/project/${projectId}/add-file?key=${apiKey}`,
        formData: {
            first_line_contains_header: '',
            escape_quotes: '0',
            json: '',
            scheme,
        },
    };
    const filename = path.parse(filePath).base;
    // files: Array keys should contain file names with path in Crowdin project.
    params.formData[`files[${filename}]`] = newMasterCsv;
    const req = request(params);
    return req;
};

/*
    Update an existing csv file in Crowdin service
    https://support.crowdin.com/api/update-file/
*/
const updateFile = (filePath, projectId, apiKey) => {
    const newMasterCsv = fs.createReadStream(filePath);
    const params = {
        method: 'POST',
        uri: `https://api.crowdin.com/api/project/${projectId}/update-file?key=${apiKey}`,
        formData: {
            first_line_contains_header: '',
            update_option: 'update_as_unapproved',
            escape_quotes: '0',
            json: '',
        },
    };
    const filename = path.parse(filePath).base;
    params.formData[`files[${filename}]`] = newMasterCsv; // Array keys should contain file names with path in Crowdin project.
    const req = request(params);
    return req;
};

/*
    Builds translations in Crowdin service. It does not actually download anything.
    This method can be invoked only once per 30 minutes.
    Translations might be downloaded in separate API call later.
    https://support.crowdin.com/api/export/
*/
const buildTranslations = (projectId, apikey) => (
    request.get(`https://api.crowdin.com/api/project/${projectId}/export?key=${apikey}`, { qs: { json: '' } })
);

/*
    Downloads a ZIP file with translations.
    https://support.crowdin.com/api/download/
*/
const downloadTranslationsZip = (projectId, apiKey) => request({
    method: 'GET',
    uri: `https://api.crowdin.com/api/project/${projectId}/download/all.zip?key=${apiKey}`,
    encoding: null,

});

/*
    Downloads a ZIP file with translations and extracts files to exportDir
*/
const exportTranslations = async (exportDir, projectId, apiKey) => {
    const exportDirAbs = path.resolve(exportDir);
    const zipFilePath = path.join(exportDir, 'temp.zip');
    // download builded translations
    const data = await downloadTranslationsZip(projectId, apiKey);
    fs.writeFileSync(zipFilePath, data);
    // extract zip
    extractZip(zipFilePath, { dir: exportDirAbs }, (err) => {
        if (err) throw (err);
        // delete downloaded zip file
        fs.unlinkSync(zipFilePath);
    });
};


module.exports = {
    addFile,
    updateFile,
    downloadTranslationsZip,
    buildTranslations,
    exportTranslations,
};
