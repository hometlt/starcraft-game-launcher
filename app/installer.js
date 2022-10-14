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
    constructor() {
        this.map = `battlenet:://starcraft/map/2/239053`;
        this.strategy = "QUEUE";
        this.fs = null;
        this.us = null;
        this.rs = null;
        // let fileClient = new GoogleDriveAPI()
        this.rs = new files_1.YandexDiskWebDAV();
        this.fs = new files_1.LocalFileClient();
        this.us = new files_1.UpdateClientHeroku();
    }
    get directory() {
        return this.fs.gameDirectory;
    }
    set directory(value) {
        this.fs.setGameDirectory(value);
    }
    get version() {
        return this.fs.version;
    }
    set version(value) {
        this.fs.setCurrentVersion(value);
    }
    versions() {
        return this.us.versions();
    }
    run() {
        (0, child_process_1.exec)(`rundll32 url.dll,FileProtocolHandler "${this.map}"`, function (err, data) {
            console.log(err);
            console.log(data.toString());
        });
        // execFile(getInstallationPath()+"/"+ "StarCraft II.exe", function(err, data) {
        //   console.log(err)
        //   console.log(data.toString());
        // });
    }
    files(version) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            let installationInfo = yield this.us.files();
            // @ts-ignore
            let versionFiles = installationInfo.filter(item => !item.path.startsWith("Versions"));
            if (version) {
                // @ts-ignore
                versionFiles.push(...installationInfo.filter(item => item.path.startsWith("Versions/" + version.directory)));
            }
            return versionFiles;
        });
    }
    check() {
        return __awaiter(this, void 0, void 0, function* () {
            let versions = yield this.versions();
            // @ts-ignore
            let version = this.version && versions.versions.find(v => v.id === this.version);
            let versionFiles = yield this.files(version);
            let size = 0;
            let ready = true;
            let error = false;
            let loaded = 0;
            let files = [];
            for (let file of versionFiles) {
                let fileReady;
                let fileProgress;
                size += file.size;
                let local = this.directory + file.path;
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
                    name: file.path,
                    // @ts-ignore
                    loaded: localFileData.size || 0,
                    size: file.size,
                    ready: fileReady,
                    progress: fileProgress
                });
            }
            return {
                // @ts-ignore
                versions: versions.versions,
                version,
                speed: null,
                progress: null,
                downloading: null,
                ready,
                error,
                gamedirectory: this.fs.gameDirectory,
                modDirectory: this.directory,
                host: this.rs.host,
                loaded,
                size,
                files
            };
        });
    }
    install({ init, progress, complete, final, error }) {
        return __awaiter(this, void 0, void 0, function* () {
            let installationData = yield this.check();
            installationData.downloading = true;
            init(installationData);
            let interval = setInterval(() => {
                installationData.speed = 0;
                installationData.progress = installationData.loaded / installationData.size * 100;
                installationData.files.forEach(file => {
                    if (file.downloading) {
                        file.speed = file.recorded;
                        installationData.speed += file.speed;
                        file.recorded = 0;
                    }
                });
            }, 1000);
            let promises = [];
            let filesTotal = installationData.files.length;
            for (let fileIndex = 0; fileIndex < filesTotal; fileIndex++) {
                let fileData = installationData.files[fileIndex];
                if (!fileData.ready) {
                    let promise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        let writeStream = this.fs.create(fileData.name);
                        this.rs.stream(fileData).then(res => {
                            fileData.recorded = 0;
                            fileData.loaded = 0;
                            fileData.speed = 0;
                            fileData.downloading = true;
                            progress(installationData);
                            // @ts-ignore
                            res.on('data', data => {
                                writeStream.write(data, () => {
                                    if (!fileData.ready) {
                                        fileData.loaded += data.length;
                                        installationData.loaded += data.length;
                                        fileData.progress = fileData.loaded / fileData.size * 100;
                                        fileData.recorded += data.length;
                                        progress(installationData);
                                    }
                                });
                            });
                            // @ts-ignore
                            res.on('end', () => {
                                resolve(fileData);
                            });
                        });
                    }))
                        .then(() => {
                        fileData.ready = true;
                        fileData.loaded = fileData.size;
                        fileData.progress = 100;
                        progress(installationData);
                        complete(fileData);
                    })
                        .catch((message) => {
                        fileData.error = true;
                        progress(installationData);
                        error(fileData);
                    })
                        .finally(() => {
                        delete fileData.recorded;
                        delete fileData.speed;
                        delete fileData.downloading;
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
            delete installationData.downloading;
            if (installationData.files.find(f => f.ready !== true) === null) {
                installationData.ready = true;
            }
            if (installationData.files.find(f => f.error !== true) !== null) {
                installationData.error = true;
            }
            clearInterval(interval);
            final(installationData);
        });
    }
}
exports.Installer = Installer;
//# sourceMappingURL=installer.js.map