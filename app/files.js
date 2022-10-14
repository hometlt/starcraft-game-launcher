"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YandexDiskWebDAV = exports.GoogleDriveAPI = exports.LocalFileClient = exports.WebDAV = exports.UpdateClientHeroku = exports.FileClient = void 0;
const fs = require("fs");
const googleapis_1 = require("googleapis");
const https = require("https");
const dom_js_1 = require("dom-js");
const storage = require("electron-json-storage");
const config_1 = require("./config/config");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const errorCodes = {
    401: 'Auth error',
    404: 'Not found',
    409: 'Conflict',
    400: 'Bad Destination',
    507: 'Insufficient Storage'
};
function request(options, encoding = null) {
    return new Promise((resolve, reject) => {
        let request = https.request(options, (res) => {
            let code = res.statusCode;
            if (code >= 200 && code < 300) {
                if (encoding) {
                    let response = '';
                    res.setEncoding('utf-8');
                    res.on('data', function (chunk) {
                        response += chunk;
                    });
                    res.on('end', function () {
                        if (encoding === 'json') {
                            resolve(JSON.parse(response));
                        }
                        else {
                            resolve(response);
                        }
                    });
                }
                else {
                    resolve(res);
                }
            }
            else {
                reject(errorCodes[code] || `Unknown error, code: ${code}`);
            }
        })
            .on('socket', (socket) => {
            socket.setTimeout(60000);
            socket.on('timeout', function () {
                request.destroy();
                reject('timeout');
            });
        })
            .on('error', (err) => {
            reject(err.message);
        })
            .end();
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class FileClient {
}
exports.FileClient = FileClient;
class UpdateClientHeroku extends FileClient {
    constructor() {
        super();
        this.infohost = config_1.default.server.host;
        this.infodomain = "";
        this.infopath = "";
        this.infourl = "";
        this.versionsurl = "versions";
        this.setInfoHost(this.infohost);
    }
    setInfoHost(host) {
        this.infohost = host;
        this.infodomain = host.substring(0, host.indexOf("/"));
        this.infopath = host.substring(host.indexOf("/"));
    }
    versions() {
        return request({
            hostname: this.infodomain,
            port: 443,
            path: this.infopath + "/" + this.versionsurl,
            method: 'GET'
        }, 'json').then(response => {
            // @ts-ignore
            return response.versions;
        });
    }
    files() {
        return request({
            hostname: this.infodomain,
            port: 443,
            path: this.infopath + "/" + this.infourl,
            method: 'GET'
        }, 'json');
    }
}
exports.UpdateClientHeroku = UpdateClientHeroku;
class WebDAV extends FileClient {
    constructor() {
        super(...arguments);
        this.directory = "";
        this.host = "";
        this.auth = "";
    }
    _normalizePath(fpath) {
        return fpath.replace(/\\/g, '/');
    }
    _getNodes(root, nodeName) {
        let res = [];
        root.children.forEach((node) => {
            if (node instanceof dom_js_1.Element) {
                if (nodeName === '*' || node.name === nodeName) {
                    res.push(node);
                }
                [].push.apply(res, this._getNodes(node, nodeName));
            }
        });
        return res;
    }
    _getNodeValue(root, nodeName) {
        let nodes = this._getNodes(root, nodeName);
        return nodes.length ? nodes[0].text() : '';
    }
    list(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield request({
                host: this.host,
                port: 443,
                method: 'PROPFIND',
                path: encodeURI(this._normalizePath(this.directory + path)),
                headers: {
                    Host: this.host,
                    Accept: '*/*',
                    Authorization: this.auth,
                    Depth: 1
                }
            }, 'text');
            return yield new Promise((resolve, reject) => {
                new dom_js_1.DomJS().parse(response, (err, root) => {
                    if (err) {
                        return reject(err);
                    }
                    try {
                        let dir = [];
                        root.children.shift();
                        root.children.forEach(node => {
                            if (node.name === 'd:response') {
                                let name = this._getNodeValue(node, 'd:displayname');
                                let directory = Boolean(this._getNodes(node, 'd:collection').length);
                                dir.push({
                                    path: path + "/" + name,
                                    name,
                                    size: directory ? null : +this._getNodeValue(node, 'd:getcontentlength'),
                                    created: new Date(this._getNodeValue(node, 'd:creationdate')).getTime(),
                                    modified: new Date(this._getNodeValue(node, 'd:getlastmodified')).getTime()
                                });
                            }
                        });
                        return resolve(dir);
                    }
                    catch (pareError) {
                        return reject(pareError);
                    }
                });
            });
        });
    }
    info(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield request({
                host: this.host,
                port: 443,
                method: 'PROPFIND',
                path: encodeURI(this._normalizePath(this.directory + path)),
                headers: {
                    Host: this.host,
                    Accept: '*/*',
                    Authorization: this.auth,
                    Depth: 1
                }
            }, 'text');
            return yield new Promise((resolve, reject) => {
                new dom_js_1.DomJS().parse(response, (err, root) => {
                    if (err) {
                        return reject(err);
                    }
                    try {
                        let dir = [];
                        root.children.forEach(node => {
                            if (node.name === 'd:response') {
                                dir.push({
                                    // href: _getNodeValue(node, 'd:href'),
                                    // isDir: Boolean(this._getNodes(node, 'd:collection').length),
                                    // path: path,
                                    // name: this._getNodeValue(node, 'd:displayname'),
                                    size: +this._getNodeValue(node, 'd:getcontentlength'),
                                    created: new Date(this._getNodeValue(node, 'd:creationdate')).getTime(),
                                    modified: new Date(this._getNodeValue(node, 'd:getlastmodified')).getTime()
                                });
                            }
                        });
                        return resolve(dir[0]);
                    }
                    catch (pareError) {
                        return reject(pareError);
                    }
                });
            });
        });
    }
    stream(fileData) {
        return request({
            host: this.host,
            port: 443,
            method: 'GET',
            path: encodeURI(this._normalizePath(this.directory + fileData.name)),
            headers: {
                'Host': this.host,
                'Accept': '*/*',
                'Authorization': this.auth,
                'TE': 'chunked',
                'Accept-Encoding': 'gzip'
            }
        });
    }
}
exports.WebDAV = WebDAV;
class LocalFileClient extends FileClient {
    constructor() {
        super();
        this.version = "";
        this.directory = "";
        this.gameDirectory = "C:/Program Files/StarCraft II";
        this.modDirectory = 'Mods/Commanders Conflict';
        this.active = 0;
        const APPS_FOLDER = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
        const HOTS_FOLDER = APPS_FOLDER + "\\Heroes Of The Strife";
        fs.mkdirSync(HOTS_FOLDER, { recursive: true });
        storage.setDataPath(HOTS_FOLDER);
        let path = storage.getSync('path');
        if (path.constructor === String) {
            this.setGameDirectory(path);
        }
        let version = storage.getSync('version');
        if (version.constructor === String) {
            // @ts-ignore
            this.version = version;
        }
    }
    resetGameDirectory() {
        return new Promise((resolve, reject) => {
            storage.remove('path', error => {
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        });
    }
    setGameDirectory(directory) {
        this.gameDirectory = directory;
        this.directory = this.gameDirectory + "/" + this.modDirectory;
        this.active++;
        return new Promise((resolve, reject) => {
            storage.set('path', this.gameDirectory, error => {
                this.active--;
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        });
    }
    info(path) {
        if (!fs.existsSync(path))
            return false;
        let localFileStats = fs.statSync(path);
        return {
            // path: path,
            // name: path.substring(path.lastIndexOf("/")),
            size: localFileStats.size,
            created: new Date(localFileStats.ctime).getTime(),
            modified: new Date(localFileStats.mtime).getTime()
        };
    }
    setCurrentVersion(version) {
        this.version = version;
        this.active++;
        // VersionControlMods
        return new Promise((resolve, reject) => {
            storage.set('version', version, error => {
                this.active--;
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        });
    }
    versions() {
        return JSON.parse(fs.readFileSync("./../util/versions.json", { encoding: 'utf-8' }));
    }
    create(filename) {
        let path = this.directory + "/" + filename;
        fs.mkdirSync(path.replace(/\\/g, '/').substring(0, path.lastIndexOf("/")), { recursive: true });
        return fs.createWriteStream(path);
    }
}
exports.LocalFileClient = LocalFileClient;
class GoogleDriveAPI extends FileClient {
    constructor() {
        super();
        this.host = 'www.googleapis.com';
        this.client = null;
        this.drive = null;
        this.cache = {};
        this.clientId = config_1.default.google.clientId;
        this.clientSecret = config_1.default.google.clientSecret;
        this.refreshToken = config_1.default.google.refreshToken;
        this.rootFolderId = config_1.default.google.rootFolderId;
        this.infourl = "files/gdrive";
        this.client = googleapis_1.google.auth.fromJSON({
            type: "authorized_user",
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: this.refreshToken
        });
        this.drive = googleapis_1.google.drive({ version: 'v3', auth: this.client });
    }
    list(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            let folderID = this.cache[folder];
            if (!folderID) {
                let folderData = yield this.info(folder);
                folderID = folderData.id;
            }
            let response = yield this.drive.files.list({
                auth: this.client,
                q: `parents in '${folderID}'`,
                fields: 'nextPageToken, files(id, name, size, createdTime, modifiedTime)'
            });
            let result = [];
            response.data.files.forEach(fileData => {
                let path = folder + "/" + fileData.name;
                this.cache[path] = fileData.id;
                result.push({
                    path: path,
                    name: fileData.name,
                    id: fileData.id,
                    size: fileData.size ? +fileData.size : null,
                    created: new Date(fileData.createdTime).getTime(),
                    modified: new Date(fileData.modifiedTime).getTime()
                });
            });
            return result;
        });
    }
    info(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileID = this.cache[fileName];
            let fileData;
            if (fileID && false) {
                // let response = await this.drive.files.get({
                //   fileId: fileID,
                //   auth: this.client,
                //   fields: 'id, name, size, createdTime, modifiedTime'
                // })
                // fileData = response.data.files[0]
            }
            else {
                let folders = fileName.split("/");
                fileID = this.rootFolderId;
                for (const folder of folders) {
                    let response = yield this.drive.files.list({
                        auth: this.client,
                        q: `parents in '${fileID}' and name = '${folder}'`,
                        fields: 'nextPageToken, files(id, name, size, createdTime, modifiedTime)'
                    });
                    fileData = response.data.files[0];
                    fileID = fileData.id;
                    this.cache[fileName] = fileID;
                }
            }
            return {
                // path: fileName,
                // name: fileData.name,
                id: fileID,
                size: fileData.size ? +fileData.size : null,
                created: new Date(fileData.createdTime).getTime(),
                modified: new Date(fileData.modifiedTime).getTime(),
            };
        });
    }
    stream(fileData) {
        return __awaiter(this, void 0, void 0, function* () {
            let somereadstream = yield this.drive.files.get({ fileId: fileData.id, alt: 'media' }, { responseType: 'stream' });
            return somereadstream.data;
        });
    }
}
exports.GoogleDriveAPI = GoogleDriveAPI;
class YandexDiskWebDAV extends WebDAV {
    constructor() {
        super(...arguments);
        this.directory = "/SC2/Commanders Conflict/";
        this.host = 'webdav.yandex.ru';
        this.auth = config_1.default.yandex.token;
        this.infourl = "files/ydisk";
    }
}
exports.YandexDiskWebDAV = YandexDiskWebDAV;
//# sourceMappingURL=files.js.map