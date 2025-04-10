"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GitFile {
    constructor(path, content = "") {
        this.path = path;
        this.content = content;
    }
    update(newContent) {
        this.content = newContent;
    }
    clone() {
        return new GitFile(this.path, this.content);
    }
}
exports.default = GitFile;
