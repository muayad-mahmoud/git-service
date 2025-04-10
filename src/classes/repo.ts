import { Actions, CommitChangeAction } from "../utils/constants";
import Branch from "./branch";
import Commit from "./commit";
import GitFile from "./git-file";
class Git {
    public name: string;
    private lastCommitId: string;
    private commits: Commit[] = [];
    public HEAD: Branch;
    public currentBranch: Branch;
    public branches: Branch[] = [];
    private remotes: Map<string, Git> = new Map();

    private workingDirectory: Map<string, GitFile> = new Map();
    private stagedFiles: Map<string, GitFile> = new Map();
    constructor(name: string) {
        this.lastCommitId = "";
        this.name = name;
        this.currentBranch = new Branch("master", null); // initially null for first commit
        this.HEAD = this.currentBranch;
        this.branches.push(this.currentBranch);
    }

    public createFile(path:string, content:string): GitFile {
        const file = new GitFile(path, content);
        this.workingDirectory.set(path, file);

        return file;
    }

    public updateFile(path: string, content: string): GitFile | undefined {
        const file = this.workingDirectory.get(path);
        if (file) {
            file.update(content);
            return file;
        }

        return undefined;
    }

    public stageFile(path: string): void {
        const file = this.workingDirectory.get(path);
        if (file) {
            this.stagedFiles.set(path, file);
            console.log(`Staged changes to ${path}`);
        } else {
            console.log(`File ${path} not found in working directory`);
        }
        
    }

    public stageAll(): void {
        if (this.workingDirectory.size === 0) {
            console.log(`No files to stage`);
            return;
        }
        this.workingDirectory.forEach((file, path) => {
            this.stagedFiles.set(path, file);
            
        })
        console.log(`Staged all changes`);
    }

    public status(): {unstaged: string[], staged: string[]} {
        const unstaged: string[] = [];
        const staged: string[] = [];

        this.workingDirectory.forEach((file, path) => {
            const stagedFile = this.stagedFiles.get(path);
            if (!stagedFile || stagedFile.content !== file.content) {
                unstaged.push(path);
            }
        });
        this.stagedFiles.forEach((stagedFile, path) => {
            staged.push(path);
        });

        return {unstaged, staged};
    }

    // Overload signatures
    public addCommit(commit: Commit): void;
    public addCommit(message: string): void;
    // Implementation
    public addCommit(commitOrMessage: Commit | string): void {
        let commit: Commit;
        
        if (commitOrMessage instanceof Commit) {
            commit = commitOrMessage;
        } else {
            commit = new Commit(
                this.HEAD!.headCommit,
                commitOrMessage,
                this.stagedFiles
            );

            this.stagedFiles = new Map(); // Clearing Staging Files
        }
        
        this.commits.push(commit);
        this.lastCommitId = commit.id;
        this.HEAD.headCommit = commit;

        commit.files.forEach((file, path) => {
            if(!this.workingDirectory.has(path)){
                this.workingDirectory.set(path, file.clone());
            }
        })
    }

    public catFile(path: string): string | undefined {
        if(this.HEAD.headCommit && this.HEAD.headCommit.files.has(path)){
            return this.HEAD.headCommit.files.get(path)?.content;
        }
        return undefined;
    }

    public getLastCommitId(): string {
        return this.lastCommitId;
    }

    public log(): Commit[] {
        var currentCommit = this.HEAD.headCommit;
        var commitLog: Commit[] = [];
        while (currentCommit) {
            commitLog.push(currentCommit);
            currentCommit = currentCommit.parent;
        }
        return commitLog;
    }

    public checkout(branchName: string): void {
        const branch = this.branches.find(b => b.name === branchName);
        if (branch) {
            this.HEAD = branch;
            console.log(`Switched to branch ${branchName}`);
        }
        else {
            console.log(`Branch ${branchName} does not exist`);
            let newBranch: Branch = new Branch(branchName, this.HEAD.headCommit);
            this.branches.push(newBranch);
            this.HEAD = newBranch;
            console.log(`Created branch ${branchName}`);
            console.log(`Switched to branch ${branchName}`);
        }

    }

    public addRemote(name: string, remoteRepo: Git): void {
        this.remotes.set(name, remoteRepo);
        console.log(`Added remote ${name} pointing to ${remoteRepo.name}`);
    }

    public getCommitById(id: string): Commit | undefined {
        return this.commits.find(commit => commit.id === id);
    }

    public hasCommit(id: string): boolean {
        return this.commits.some(commit => commit.id === id);
    }

    public push(remoteName: string, branchName: string): void {
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
        const commitsToPush: Commit[] = [];
        let currentCommit = sourceBranch.headCommit;

        while (currentCommit) {
            if(remoteRepo.hasCommit(currentCommit.id)){
                console.log(`Commit ${currentCommit.id} already exists in remote ${remoteName}`);
                break;
            }
            commitsToPush.unshift(currentCommit);
            currentCommit = currentCommit.parent;

        }

        for(const commit of commitsToPush){
            remoteRepo.addCommit(commit);
        }
        
        const remoteBranch = remoteRepo.branches.find(b => b.name === branchName);
        if (remoteBranch) {
            remoteBranch.headCommit = sourceBranch.headCommit;
        } else {
            remoteRepo.branches.push(new Branch(branchName, sourceBranch.headCommit));
            
        }

        console.log(`Pushed ${commitsToPush.length} commits to remote ${remoteName} on branch ${branchName}`);
    }


    public pull(remoteName: string, branchName: string): void {
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

        const commitsToPull: Commit[] = [];
        let currentCommit = remoteBranch.headCommit;
        while (currentCommit) {
            if(!this.hasCommit(currentCommit.id)){
                commitsToPull.unshift(currentCommit);
            }else {
                break;
            }

            currentCommit = currentCommit.parent;
        }
        for (const commit of commitsToPull) {
            this.addCommit(commit);
        }

        if(commitsToPull.length > 0){
            this.HEAD.headCommit = remoteBranch.headCommit;
            this.lastCommitId = remoteBranch.headCommit?.id!;
        }

        console.log(`Pulled ${commitsToPull.length} commits from remote ${remoteName} on branch ${branchName}`);
    }

    public static clone(remoteRepo: Git): Git {
        console.log(`Cloning '${remoteRepo.name}' into '${remoteRepo.name}-local}'...`);
    
    // Create new repository
    const clonedRepo = new Git(remoteRepo.name + "-local");
    
    const commitMap = new Map<string, Commit>();

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
      const clonedCommit = new Commit(parentInClone!, originalCommit.message);
      
      // Track this commit for future parent references
      commitMap.set(originalCommit.id, clonedCommit);
      
      // Add to the cloned repo
      clonedRepo.commits.push(clonedCommit);
    }
    
    // Copy branches
    clonedRepo.branches = [];
    for (const branch of remoteRepo.branches) {
        const newBranch = new Branch(branch.name, branch.headCommit);
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
            if(!clonedRepo.workingDirectory.has(path)){
                clonedRepo.workingDirectory.set(path, file.clone());
            }
        })
    }
    
    console.log(`Successfully cloned repository to ${remoteRepo}`);
    return clonedRepo;
    }

    public merge (sourceBranchName: string): void {
        const sourceBranch = this.branches.find(b => b.name === sourceBranchName);
        if(!sourceBranch) {
            console.log(`Branch ${sourceBranchName} not found`);
            return;
        }

        if(this.HEAD.name === sourceBranchName) {
            console.log(`Cannot merge branch ${sourceBranchName} into itself`);
            return;
        }

        if(!this.HEAD.headCommit) {
            console.log(`No commits in current branch`);
            this.HEAD.headCommit = sourceBranch.headCommit;
            console.log(`Merged branch ${sourceBranchName} into current branch`);
            return;
        }

        const commonAncestor = this.findCommonAncestor(this.HEAD.headCommit, sourceBranch.headCommit!);

        if(!commonAncestor) {
            console.log(`No common ancestor found for merge`);
            return;
        }

        //Fast-forward merge
        if(commonAncestor.id === this.HEAD.headCommit.id) {
            console.log(`Fast-forward merge from ${sourceBranchName} to ${this.HEAD.name}`);
            this.HEAD.headCommit = sourceBranch.headCommit;
            return;
        }

        //Three-way merge
        const mergedFiles = this.mergeFiles(
            commonAncestor,
            this.HEAD.headCommit,
            sourceBranch.headCommit!
        )

        //create merge commit
        const mergeCommit = this.createMergeCommit(
            this.HEAD.headCommit,
            mergedFiles,
            sourceBranchName
        );

        mergeCommit.secondParent = sourceBranch.headCommit;

        this.commits.push(mergeCommit);
        this.lastCommitId = mergeCommit.id;
        this.HEAD.headCommit = mergeCommit;
    }


    private createMergeCommit(
        headCommit: Commit,
        mergedFiles: Map<string, GitFile>,
        sourceBranchName: string
    )
    {
        const mergeCommit = new Commit(
            headCommit,
            `Merge branch ${sourceBranchName} into ${this.HEAD.name}`,
            mergedFiles
        )
        return mergeCommit;
    }

    private findCommonAncestor(commit1: Commit, commit2: Commit): Commit | null {
        const ancestors1 = new Set<string>();

        let current = commit1;
        while (current){
            ancestors1.add(current.id);
            current = current.parent!;
        }

        let current2 = commit2;

        while(current2) {
            if(ancestors1.has(current2.id))
                return this.getCommitById(current2.id) || null;

            current2 = current2.parent!;
        }
        return null;
    }

    private mergeFiles(
        commonAncestor: Commit,
        currentBranchHead: Commit,
        sourceBranchHead: Commit
    ): Map<string, GitFile> {
        
        const mergedFiles = new Map<string, GitFile>();
        
        currentBranchHead.files.forEach((file, path) => {
            mergedFiles.set(path, file.clone());
        })

        sourceBranchHead.files.forEach((sourceFile, path) => {
            if(!mergedFiles.has(path)){
                mergedFiles.set(path, sourceFile.clone());
                return;
            }

            const ancestorFile = commonAncestor.files.get(path);

            if(!ancestorFile || ancestorFile.content !== sourceFile.content){
                const currentFile = mergedFiles.get(path);
                if(currentFile && ancestorFile && currentFile.content !== ancestorFile.content){
                    console.log(`Conflict in file ${path}`);
                    const conflictContent = this.generateConflictContent(
                        currentFile.content,
                        sourceFile.content
                    );

                    currentFile.update(conflictContent);
                }else {
                    //Case of no Conflict
                    mergedFiles.set(path, sourceFile.clone());
                }
            }
        });
        
        return mergedFiles

    }
    
    private generateConflictContent(currentContent: string, sourceContent: string) {
        return `<<<<<<< HEAD\n${currentContent}\n=======\n${sourceContent}\n>>>>>>>`;
    }

    public rebase (targetBranchName: string): void {
        const targetBranch = this.branches.find(b=> b.name === targetBranchName);

        if(!targetBranch) {
            console.log(`Branch ${targetBranchName} not found`);
            return;
        }

        if(this.HEAD.name === targetBranchName) {
            console.log(`Cannot rebase branch ${targetBranchName} onto itself`);
            return;
        }

        //Making sure that both branches has commits 
        if(!this.HEAD.headCommit) {
            console.log(`No commits in current branch`);
            return;
        }

        if(!targetBranch.headCommit) {
            console.log(`No commits in target branch`);
            return;
        }

        const commonAncestor = this.findCommonAncestor(this.HEAD.headCommit, targetBranch.headCommit!);

        if(!commonAncestor) {
            console.log(`No common ancestor found for rebase`);
            return;
        }

        //fast-forward
        if(commonAncestor.id === this.HEAD.headCommit.id) {
            console.log(`Fast-forward rebase from ${targetBranchName} to ${this.HEAD.name}`);
            this.HEAD.headCommit = targetBranch.headCommit;
            return;
        }

        const commitsToRebase: Commit[] = [];
        let currentCommit = this.HEAD.headCommit;

        while(currentCommit && currentCommit.id !== commonAncestor.id) {
            commitsToRebase.unshift(currentCommit);
            currentCommit = currentCommit.parent!;
        }

        commitsToRebase.reverse();

        console.log(`Rebasing ${commitsToRebase.length} commits onto ${targetBranchName}`);

        let newBase = targetBranch.headCommit;
        for(const commit of commitsToRebase) {
            const changes = this.getCommitChanges(commit);

            const rebasedFiles = this.applyChanges(
                newBase.files,
                changes
            );

            const newCommit = new Commit(
                newBase,
                commit.message,
                rebasedFiles
            );

            this.commits.push(newCommit);
            newBase = newCommit;
        }

        this.HEAD.headCommit = newBase;
        this.lastCommitId = newBase.id;

        console.log(`Successfully rebased ${this.HEAD.name} onto ${targetBranchName}`);
    }

    private getCommitChanges(commit: Commit): Map<string, CommitChangeAction> {
        const changes = new Map<string, CommitChangeAction>();

        // No parent, hence all files are added
        if(!commit.parent){
            commit.files.forEach((file, path) => {
                changes.set(path, new CommitChangeAction(Actions.ADD, file.content));
            });
            return changes;
        }

        //Handle add and modifications
        commit.files.forEach((file, path) => {
            const parentFile = commit.parent?.files.get(path);

            if(!parentFile) {
                //File is added in this commit
                changes.set(path, new CommitChangeAction(Actions.ADD, file.content));
            }
            else if(parentFile.content !== file.content) {
                //File was modified
                changes.set(path, new CommitChangeAction(Actions.UPDATE, file.content));
            }
        });

        //Handle Deletion
        commit.parent?.files.forEach((file, path) => {
            if(!commit.files.has(path)) {
                //File was deleted
                changes.set(path, new CommitChangeAction(Actions.REMOVE, file.content));
            }
        })

        return changes;

    }


    private applyChanges(
        baseFiles: Map<string, GitFile>,
        changes: Map<string, CommitChangeAction>
    ): Map<string, GitFile> {
        //Cloning base files
        const resultFiles = new Map<string, GitFile>();

        baseFiles.forEach((file, path) => {
            resultFiles.set(path, file.clone());
        });

        //Applying Changes
        changes.forEach((change, path) => {
            switch(change.action) {
                case Actions.ADD:
                case Actions.UPDATE:
                    resultFiles.set(path, new GitFile(path, change.content));
                    break;
                case Actions.REMOVE:
                    resultFiles.delete(path);
                    break;
                
            }
        })
        return resultFiles;

    }

        
}

export default Git;