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
exports.Installer = void 0;
const child_process_1 = require("child_process");
const files_1 = require("./files");
class Installer {
    constructor({ update }) {
        this.map = `battlenet://starcraft/map/2/239053`;
        this.strategy = "PARALLEL";
        this.fs = null;
        this.us = null;
        this.rs = null;
        this.state = {
            downloading: false,
            initializing: true,
            copying: false,
            ready: false,
            error: false,
            speed: 0,
            progress: 0,
            loaded: 0,
            size: 0,
            files: null,
            versions: null,
            version: "",
            gameDirectory: "",
            gameDirectoryCorrect: false,
            modDirectory: "",
            host: "",
        };
        this.fileServers = null;
        this.versions = null;
        this.updateCallback = null;
        this.requests = [];
        this._files = null;
        this.updateCallback = update;
        this.fileServers = {
            google: files_1.GoogleDriveAPI,
            yandex: files_1.YandexDiskWebDAV
        };
        this.rs = new this.fileServers.google();
        this.fs = new files_1.LocalFileClient();
        this.us = new files_1.UpdateClientHeroku();
        this.us.infourl = this.rs.infourl;
        this.initialize();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.host = this.rs.host;
            this.state.modDirectory = this.fs.modDirectory;
            this.state.gameDirectory = this.fs.gameDirectory;
            this.state.gameDirectoryCorrect = this.fs.gameDirectoryCorrect;
            this.update();
            this.versions = yield this.us.versions();
            this.state.versions = this.versions;
            this.state.version = this.fs.version;
            this.update();
            yield this.check();
            this.state.initializing = false;
            this.update();
        });
    }
    update() {
        this.updateCallback(this.state);
    }
    get directory() {
        return this.fs.gameDirectory;
    }
    get version() {
        return this.fs.version;
    }
    openGameDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            this.fs.openDirectory(this.state.gameDirectory);
        });
    }
    openModDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            this.fs.openDirectory(this.state.modDirectory);
        });
    }
    setDirectory(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.fs.setGameDirectory(value);
            this.state.initializing = true;
            this.state.gameDirectory = this.fs.gameDirectory;
            this.state.gameDirectoryCorrect = this.fs.gameDirectoryCorrect;
            this.update();
            yield this.check();
            this.state.initializing = false;
            this.update();
        });
    }
    setVersion(value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.fs.setCurrentVersion(value);
            this.state.initializing = true;
            this.state.version = value;
            yield this.check();
            this.state.initializing = false;
            this.state.copying = true;
            this.update();
            let version = this.version && this.versions.find(v => v.id === this.version);
            yield this.fs.copyVersionControlFiles(version.directory);
            this.state.copying = false;
            this.update();
        });
    }
    run() {
        //Windows
        (0, child_process_1.exec)(`rundll32 url.dll,FileProtocolHandler "${this.map}"`, function (err, data) {
            console.log(err);
            console.log(data.toString());
        });
    }
    files(version) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // @ts-ignore
                let installationInfo = yield this.us.files();
                // @ts-ignore
                let versionFiles = installationInfo.filter(item => !item.path.startsWith("Versions"));
                if (version) {
                    // @ts-ignore
                    versionFiles.push(...installationInfo.filter(item => item.path.startsWith("Versions/" + version.directory)));
                }
                return versionFiles;
            }
            catch (e) {
                console.log("error", e);
            }
        });
    }
    check() {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            let version = this.version && this.versions.find(v => v.id === this.version);
            this._files = yield this.files(version);
            let size = 0;
            let ready = this.state.gameDirectoryCorrect;
            let error = false;
            let loaded = 0;
            let files = [];
            for (let file of this._files) {
                let fileReady;
                let fileProgress;
                size += file.size;
                let local = this.fs.directory + "/" + file.path;
                let localFileData = yield this.fs.info(local);
                if (localFileData) {
                    loaded += localFileData.size;
                    fileReady = localFileData.modified >= file.modified && localFileData.size === file.size;
                    if (fileReady) {
                        fileProgress = 100;
                    }
                    else {
                        fileProgress = file.loaded / file.size * 100;
                        ready = false;
                    }
                }
                else {
                    fileReady = false;
                    fileProgress = 0;
                    ready = false;
                }
                files.push({
                    local,
                    id: file.id,
                    name: file.path,
                    // @ts-ignore
                    loaded: localFileData.size || 0,
                    size: file.size,
                    ready: fileReady,
                    progress: fileProgress
                });
            }
            Object.assign(this.state, {
                ready,
                error,
                loaded,
                size,
                files,
                initializing: false
            });
            return this.state;
        });
    }
    cancel() {
        for (let request of this.requests) {
            request.destroy();
            this.state.downloading = false;
            this.state.speed = 0;
            this.state.progress = this.state.loaded / this.state.size * 100;
            this.state.ready = this.state.files.find(f => f.ready !== true) === null;
            this.state.error = this.state.files.find(f => f.error !== true) !== null;
            this.update();
        }
    }
    install({ onInstallBegin = null, onUploadingProgress = null, onUploadingComplete = null, onInstallComplete = null, onInstallError = null }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.initializing = true;
            this.update();
            yield this.check();
            this.state.downloading = true;
            this.update();
            onInstallBegin === null || onInstallBegin === void 0 ? void 0 : onInstallBegin(this.state);
            let interval = setInterval(() => {
                this.state.speed = 0;
                this.state.progress = this.state.loaded / this.state.size * 100;
                this.state.files.forEach(file => {
                    if (file.downloading) {
                        file.speed = file.recorded;
                        this.state.speed += file.speed;
                        file.recorded = 0;
                    }
                });
                this.update();
            }, 1000);
            let promises = [];
            let filesTotal = this.state.files.length;
            for (let fileIndex = 0; fileIndex < filesTotal; fileIndex++) {
                let fileData = this.state.files[fileIndex];
                if (!fileData.ready) {
                    let promise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        let writeStream = this.fs.create(fileData.name);
                        let readStream = yield this.rs.stream(fileData);
                        this.requests.push(readStream);
                        Object.assign(fileData, { recorded: 0, loaded: 0, speed: 0, downloading: true });
                        onUploadingProgress === null || onUploadingProgress === void 0 ? void 0 : onUploadingProgress(fileData);
                        this.update();
                        // @ts-ignore
                        readStream.on('data', data => {
                            writeStream.write(data, () => {
                                if (!fileData.ready) {
                                    fileData.loaded += data.length;
                                    this.state.loaded += data.length;
                                    fileData.progress = fileData.loaded / fileData.size * 100;
                                    fileData.recorded += data.length;
                                    onUploadingProgress === null || onUploadingProgress === void 0 ? void 0 : onUploadingProgress(fileData);
                                    this.update();
                                }
                            });
                        });
                        // @ts-ignore
                        readStream.on('end', () => {
                            resolve(fileData);
                            this.requests.splice(this.requests.indexOf(readStream), 1);
                        });
                    }))
                        .then(() => {
                        fileData.ready = true;
                        fileData.loaded = fileData.size;
                        fileData.progress = 100;
                        onUploadingComplete === null || onUploadingComplete === void 0 ? void 0 : onUploadingComplete(fileData);
                    })
                        .catch((message) => {
                        fileData.error = true;
                        onInstallError === null || onInstallError === void 0 ? void 0 : onInstallError(fileData);
                    })
                        .finally(() => {
                        delete fileData.recorded;
                        delete fileData.speed;
                        delete fileData.downloading;
                        this.update();
                        return fileData;
                    });
                    if (this.strategy === "QUEUE") {
                        yield promise;
                    }
                    if (this.strategy === "PARALLEL") {
                        promises.push(promise);
                    }
                }
            }
            if (this.strategy === "PARALLEL") {
                yield Promise.all(promises);
            }
            this.state.downloading = false;
            this.state.speed = 0;
            this.state.progress = this.state.loaded / this.state.size * 100;
            clearInterval(interval);
            onInstallComplete === null || onInstallComplete === void 0 ? void 0 : onInstallComplete();
            this.update();
            yield this.setVersion(this.version);
            this.state.error = this.state.files.find(f => f.error !== true) !== null;
            this.state.ready = this.state.files.find(f => f.ready !== true) === null;
            this.update();
        });
    }
}
exports.Installer = Installer;
//# sourceMappingURL=installer.js.map