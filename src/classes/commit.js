"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Commit {
    constructor(parent, message, files = new Map()) {
        this.id = Array.from({ length: 15 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        this.message = message;
        this.parent = parent;
        this.secondParent = null;
        this.timestamp = new Date();
        this.files = new Map();
        files.forEach((file, path) => {
            this.files.set(path, file.clone());
        });
    }
    getFiles(path) {
        return this.files.get(path);
    }
    hasFile(path) {
        return this.files.has(path);
    }
}
exports.default = Commit;
