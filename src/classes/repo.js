"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../utils/constants");
const branch_1 = __importDefault(require("./branch"));
const commit_1 = __importDefault(require("./commit"));
const git_file_1 = __importDefault(require("./git-file"));
class Git {
    constructor(name) {
        this.commits = [];
        this.branches = [];
        this.remotes = new Map();
        this.workingDirectory = new Map();
        this.stagedFiles = new Map();
        this.lastCommitId = "";
        this.name = name;
        this.currentBranch = new branch_1.default("master", null); // initially null for first commit
        this.HEAD = this.currentBranch;
        this.branches.push(this.currentBranch);
    }
    createFile(path, content) {
        const file = new git_file_1.default(path, content);
        this.workingDirectory.set(path, file);
        return file;
    }
    updateFile(path, content) {
        const file = this.workingDirectory.get(path);
        if (file) {
            file.update(content);
            return file;
        }
        return undefined;
    }
    stageFile(path) {
        const file = this.workingDirectory.get(path);
        if (file) {
            this.stagedFiles.set(path, file);
            console.log(`Staged changes to ${path}`);
        }
        else {
            console.log(`File ${path} not found in working directory`);
        }
    }
    stageAll() {
        if (this.workingDirectory.size === 0) {
            console.log(`No files to stage`);
            return;
        }
        this.workingDirectory.forEach((file, path) => {
            this.stagedFiles.set(path, file);
        });
        console.log(`Staged all changes`);
    }
    status() {
        const unstaged = [];
        const staged = [];
        this.workingDirectory.forEach((file, path) => {
            const stagedFile = this.stagedFiles.get(path);
            if (!stagedFile || stagedFile.content !== file.content) {
                unstaged.push(path);
            }
        });
        this.stagedFiles.forEach((stagedFile, path) => {
            staged.push(path);
        });
        return { unstaged, staged };
    }
    // Implementation
    addCommit(commitOrMessage) {
        let commit;
        if (commitOrMessage instanceof commit_1.default) {
            commit = commitOrMessage;
        }
        else {
            commit = new commit_1.default(this.HEAD.headCommit, commitOrMessage, this.stagedFiles);
            this.stagedFiles = new Map(); // Clearing Staging Files
        }
        this.commits.push(commit);
        this.lastCommitId = commit.id;
        this.HEAD.headCommit = commit;
        commit.files.forEach((file, path) => {
            if (!this.workingDirectory.has(path)) {
                this.workingDirectory.set(path, file.clone());
            }
        });
    }
    catFile(path) {
        var _a;
        if (this.HEAD.headCommit && this.HEAD.headCommit.files.has(path)) {
            return (_a = this.HEAD.headCommit.files.get(path)) === null || _a === void 0 ? void 0 : _a.content;
        }
        return undefined;
    }
    getLastCommitId() {
        return this.lastCommitId;
    }
    log() {
        var currentCommit = this.HEAD.headCommit;
        var commitLog = [];
        while (currentCommit) {
            commitLog.push(currentCommit);
            currentCommit = currentCommit.parent;
        }
        return commitLog;
    }
    checkout(branchName) {
        const branch = this.branches.find(b => b.name === branchName);
        if (branch) {
            this.HEAD = branch;
            console.log(`Switched to branch ${branchName}`);
        }
        else {
            console.log(`Branch ${branchName} does not exist`);
            let newBranch = new branch_1.default(branchName, this.HEAD.headCommit);
            this.branches.push(newBranch);
            this.HEAD = newBranch;
            console.log(`Created branch ${branchName}`);
            console.log(`Switched to branch ${branchName}`);
        }
    }
    addRemote(name, remoteRepo) {
        this.remotes.set(name, remoteRepo);
        console.log(`Added remote ${name} pointing to ${remoteRepo.name}`);
    }
    getCommitById(id) {
        return this.commits.find(commit => commit.id === id);
    }
    hasCommit(id) {
        return this.commits.some(commit => commit.id === id);
    }
    push(remoteName, branchName) {
        const remoteRepo = this.remotes.get(remoteName);
        if (!remoteRepo) {
            console.log(`Remote ${remoteName} not found`);
            return;
        }
        const sourceBranch = branchName ?
            this.branches.find(b => b.name === branchName) :
            this.currentBranch;
        if (!sourceBranch) {
            console.log(`Branch ${branchName} not found`);
            return;
        }
        const commitsToPush = [];
        let currentCommit = sourceBranch.headCommit;
        while (currentCommit) {
            if (remoteRepo.hasCommit(currentCommit.id)) {
                console.log(`Commit ${currentCommit.id} already exists in remote ${remoteName}`);
                break;
            }
            commitsToPush.unshift(currentCommit);
            currentCommit = currentCommit.parent;
        }
        for (const commit of commitsToPush) {
            remoteRepo.addCommit(commit);
        }
        const remoteBranch = remoteRepo.branches.find(b => b.name === branchName);
        if (remoteBranch) {
            remoteBranch.headCommit = sourceBranch.headCommit;
        }
        else {
            remoteRepo.branches.push(new branch_1.default(branchName, sourceBranch.headCommit));
        }
        console.log(`Pushed ${commitsToPush.length} commits to remote ${remoteName} on branch ${branchName}`);
    }
    pull(remoteName, branchName) {
        var _a;
        const remote = this.remotes.get(remoteName);
        if (!remote) {
            console.log(`Remote ${remoteName} not found`);
            return;
        }
        const remoteBranch = remote.branches.find(b => b.name === branchName);
        if (!remoteBranch) {
            console.log(`Branch ${branchName} not found in remote ${remoteName}`);
            return;
        }
        const commitsToPull = [];
        let currentCommit = remoteBranch.headCommit;
        while (currentCommit) {
            if (!this.hasCommit(currentCommit.id)) {
                commitsToPull.unshift(currentCommit);
            }
            else {
                break;
            }
            currentCommit = currentCommit.parent;
        }
        for (const commit of commitsToPull) {
            this.addCommit(commit);
        }
        if (commitsToPull.length > 0) {
            this.HEAD.headCommit = remoteBranch.headCommit;
            this.lastCommitId = (_a = remoteBranch.headCommit) === null || _a === void 0 ? void 0 : _a.id;
        }
        console.log(`Pulled ${commitsToPull.length} commits from remote ${remoteName} on branch ${branchName}`);
    }
    static clone(remoteRepo) {
        console.log(`Cloning '${remoteRepo.name}' into '${remoteRepo.name}-local}'...`);
        // Create new repository
        const clonedRepo = new Git(remoteRepo.name + "-local");
        const commitMap = new Map();
        // Process commits in order they appear in the original repo
        for (const originalCommit of remoteRepo.commits) {
            // Find or create the parent commit in our new repo
            let parentInClone = null;
            if (originalCommit.parent) {
                parentInClone = commitMap.get(originalCommit.parent.id);
                if (!parentInClone) {
                    console.warn(`Parent commit ${originalCommit.parent.id} not found during clone`);
                }
            }
            // Create a new commit in our cloned repo with the same message
            const clonedCommit = new commit_1.default(parentInClone, originalCommit.message);
            // Track this commit for future parent references
            commitMap.set(originalCommit.id, clonedCommit);
            // Add to the cloned repo
            clonedRepo.commits.push(clonedCommit);
        }
        // Copy branches
        clonedRepo.branches = [];
        for (const branch of remoteRepo.branches) {
            const newBranch = new branch_1.default(branch.name, branch.headCommit);
            clonedRepo.branches.push(newBranch);
            // Set current branch and HEAD
            if (remoteRepo.currentBranch === branch) {
                clonedRepo.currentBranch = newBranch;
                clonedRepo.HEAD = newBranch;
            }
        }
        // Setup remote connection back to source
        clonedRepo.addRemote(remoteRepo.name, remoteRepo);
        // Update last commit ID
        if (clonedRepo.HEAD.headCommit) {
            clonedRepo.lastCommitId = clonedRepo.HEAD.headCommit.id;
            clonedRepo.HEAD.headCommit.files.forEach((file, path) => {
                if (!clonedRepo.workingDirectory.has(path)) {
                    clonedRepo.workingDirectory.set(path, file.clone());
                }
            });
        }
        console.log(`Successfully cloned repository to ${remoteRepo}`);
        return clonedRepo;
    }
    merge(sourceBranchName) {
        const sourceBranch = this.branches.find(b => b.name === sourceBranchName);
        if (!sourceBranch) {
            console.log(`Branch ${sourceBranchName} not found`);
            return;
        }
        if (this.HEAD.name === sourceBranchName) {
            console.log(`Cannot merge branch ${sourceBranchName} into itself`);
            return;
        }
        if (!this.HEAD.headCommit) {
            console.log(`No commits in current branch`);
            this.HEAD.headCommit = sourceBranch.headCommit;
            console.log(`Merged branch ${sourceBranchName} into current branch`);
            return;
        }
        const commonAncestor = this.findCommonAncestor(this.HEAD.headCommit, sourceBranch.headCommit);
        if (!commonAncestor) {
            console.log(`No common ancestor found for merge`);
            return;
        }
        //Fast-forward merge
        if (commonAncestor.id === this.HEAD.headCommit.id) {
            console.log(`Fast-forward merge from ${sourceBranchName} to ${this.HEAD.name}`);
            this.HEAD.headCommit = sourceBranch.headCommit;
            return;
        }
        //Three-way merge
        const mergedFiles = this.mergeFiles(commonAncestor, this.HEAD.headCommit, sourceBranch.headCommit);
        //create merge commit
        const mergeCommit = this.createMergeCommit(this.HEAD.headCommit, mergedFiles, sourceBranchName);
        mergeCommit.secondParent = sourceBranch.headCommit;
        this.commits.push(mergeCommit);
        this.lastCommitId = mergeCommit.id;
        this.HEAD.headCommit = mergeCommit;
    }
    createMergeCommit(headCommit, mergedFiles, sourceBranchName) {
        const mergeCommit = new commit_1.default(headCommit, `Merge branch ${sourceBranchName} into ${this.HEAD.name}`, mergedFiles);
        return mergeCommit;
    }
    findCommonAncestor(commit1, commit2) {
        const ancestors1 = new Set();
        let current = commit1;
        while (current) {
            ancestors1.add(current.id);
            current = current.parent;
        }
        let current2 = commit2;
        while (current2) {
            if (ancestors1.has(current2.id))
                return this.getCommitById(current2.id) || null;
            current2 = current2.parent;
        }
        return null;
    }
    mergeFiles(commonAncestor, currentBranchHead, sourceBranchHead) {
        const mergedFiles = new Map();
        currentBranchHead.files.forEach((file, path) => {
            mergedFiles.set(path, file.clone());
        });
        sourceBranchHead.files.forEach((sourceFile, path) => {
            if (!mergedFiles.has(path)) {
                mergedFiles.set(path, sourceFile.clone());
                return;
            }
            const ancestorFile = commonAncestor.files.get(path);
            if (!ancestorFile || ancestorFile.content !== sourceFile.content) {
                const currentFile = mergedFiles.get(path);
                if (currentFile && ancestorFile && currentFile.content !== ancestorFile.content) {
                    console.log(`Conflict in file ${path}`);
                    const conflictContent = this.generateConflictContent(currentFile.content, sourceFile.content);
                    currentFile.update(conflictContent);
                }
                else {
                    //Case of no Conflict
                    mergedFiles.set(path, sourceFile.clone());
                }
            }
        });
        return mergedFiles;
    }
    generateConflictContent(currentContent, sourceContent) {
        return `<<<<<<< HEAD\n${currentContent}\n=======\n${sourceContent}\n>>>>>>>`;
    }
    rebase(targetBranchName) {
        const targetBranch = this.branches.find(b => b.name === targetBranchName);
        if (!targetBranch) {
            console.log(`Branch ${targetBranchName} not found`);
            return;
        }
        if (this.HEAD.name === targetBranchName) {
            console.log(`Cannot rebase branch ${targetBranchName} onto itself`);
            return;
        }
        //Making sure that both branches has commits 
        if (!this.HEAD.headCommit) {
            console.log(`No commits in current branch`);
            return;
        }
        if (!targetBranch.headCommit) {
            console.log(`No commits in target branch`);
            return;
        }
        const commonAncestor = this.findCommonAncestor(this.HEAD.headCommit, targetBranch.headCommit);
        if (!commonAncestor) {
            console.log(`No common ancestor found for rebase`);
            return;
        }
        //fast-forward
        if (commonAncestor.id === this.HEAD.headCommit.id) {
            console.log(`Fast-forward rebase from ${targetBranchName} to ${this.HEAD.name}`);
            this.HEAD.headCommit = targetBranch.headCommit;
            return;
        }
        const commitsToRebase = [];
        let currentCommit = this.HEAD.headCommit;
        while (currentCommit && currentCommit.id !== commonAncestor.id) {
            commitsToRebase.unshift(currentCommit);
            currentCommit = currentCommit.parent;
        }
        commitsToRebase.reverse();
        console.log(`Rebasing ${commitsToRebase.length} commits onto ${targetBranchName}`);
        let newBase = targetBranch.headCommit;
        for (const commit of commitsToRebase) {
            const changes = this.getCommitChanges(commit);
            const rebasedFiles = this.applyChanges(newBase.files, changes);
            const newCommit = new commit_1.default(newBase, commit.message, rebasedFiles);
            this.commits.push(newCommit);
            newBase = newCommit;
        }
        this.HEAD.headCommit = newBase;
        this.lastCommitId = newBase.id;
        console.log(`Successfully rebased ${this.HEAD.name} onto ${targetBranchName}`);
    }
    getCommitChanges(commit) {
        var _a;
        const changes = new Map();
        // No parent, hence all files are added
        if (!commit.parent) {
            commit.files.forEach((file, path) => {
                changes.set(path, new constants_1.CommitChangeAction(constants_1.Actions.ADD, file.content));
            });
            return changes;
        }
        //Handle add and modifications
        commit.files.forEach((file, path) => {
            var _a;
            const parentFile = (_a = commit.parent) === null || _a === void 0 ? void 0 : _a.files.get(path);
            if (!parentFile) {
                //File is added in this commit
                changes.set(path, new constants_1.CommitChangeAction(constants_1.Actions.ADD, file.content));
            }
            else if (parentFile.content !== file.content) {
                //File was modified
                changes.set(path, new constants_1.CommitChangeAction(constants_1.Actions.UPDATE, file.content));
            }
        });
        //Handle Deletion
        (_a = commit.parent) === null || _a === void 0 ? void 0 : _a.files.forEach((file, path) => {
            if (!commit.files.has(path)) {
                //File was deleted
                changes.set(path, new constants_1.CommitChangeAction(constants_1.Actions.REMOVE, file.content));
            }
        });
        return changes;
    }
    applyChanges(baseFiles, changes) {
        //Cloning base files
        const resultFiles = new Map();
        baseFiles.forEach((file, path) => {
            resultFiles.set(path, file.clone());
        });
        //Applying Changes
        changes.forEach((change, path) => {
            switch (change.action) {
                case constants_1.Actions.ADD:
                case constants_1.Actions.UPDATE:
                    resultFiles.set(path, new git_file_1.default(path, change.content));
                    break;
                case constants_1.Actions.REMOVE:
                    resultFiles.delete(path);
                    break;
            }
        });
        return resultFiles;
    }
}
exports.default = Git;
