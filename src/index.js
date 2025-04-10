"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repo_1 = __importDefault(require("./classes/repo"));
// Create a new repository
const repo = new repo_1.default("my-project");
// Create and stage files
repo.createFile("README.md", "# My Project\nThis is a sample project");
repo.createFile("src/main.ts", "console.log('Hello, world!');");
repo.stageFile("README.md");
repo.stageFile("src/main.ts");
// Make initial commit
repo.addCommit("Initial commit with README and main.ts");
// Make changes to files
repo.updateFile("README.md", "# My Project\nThis is a sample project\n\n## Features\n- Feature 1\n- Feature 2");
repo.createFile("src/utils.ts", "export function greet(name: string) {\n  return `Hello, ${name}!`;\n}");
// Check status
const status = repo.status();
console.log("Unstaged files:", status.unstaged);
console.log("Staged files:", status.staged);
// Stage and commit changes
repo.stageAll();
repo.addCommit("Added features section to README and utils.ts");
// View repository history
console.log("Commit history:");
const history = repo.log();
history.forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
    console.log(`Files: ${Array.from(commit.files.keys()).join(', ')}`);
});
// Clone the repository
const clonedRepo = repo_1.default.clone(repo);
// Check files in the cloned repo
console.log("Files in cloned repo:");
const readme = clonedRepo.catFile("README.md");
console.log("README.md content:", readme);
// Try branching functionality
console.log("\nTesting branch functionality:");
repo.checkout("feature-branch");
repo.createFile("feature.txt", "This is a new feature");
repo.stageAll();
repo.addCommit("Added feature in feature branch");
console.log("\nFeature branch commits:");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
// Switch back to master
repo.checkout("master");
console.log("\nMaster branch commits:");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
// Add this to the end of your index.ts file
// Test merge functionality
console.log("\n=== Testing merge functionality ===");
// Create a new branch from master and make changes
repo.checkout("master"); // Make sure we're on master
repo.checkout("feature-branch-2");
repo.createFile("feature2.txt", "This is another feature");
repo.stageAll();
repo.addCommit("Added feature2.txt in feature-branch-2");
// Go back to master and make a different change
repo.checkout("master");
repo.createFile("master.txt", "This is a file on master");
repo.stageAll();
repo.addCommit("Added master.txt to master branch");
// Show both branches' commits
console.log("\nMaster branch commits:");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
console.log("\nfeature-branch-2 commits:");
repo.checkout("feature-branch-2");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
// Now merge feature-branch-2 into master
repo.checkout("master");
console.log("\nMerging feature-branch-2 into master:");
repo.merge("feature-branch-2");
// Show merged commit history
console.log("\nMaster branch commits after merge:");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
    if (commit.secondParent) {
        console.log(`  Merge commit with second parent: ${commit.secondParent.id.substring(0, 7)}`);
    }
});
// Let's create a merge conflict
repo.checkout("feature-branch");
repo.createFile("conflict.txt", "Feature branch version");
repo.stageAll();
repo.addCommit("Added conflict.txt in feature branch");
repo.checkout("master");
repo.createFile("conflict.txt", "Master branch version");
repo.stageAll();
repo.addCommit("Added conflict.txt in master");
// Merge and observe conflict
console.log("\nMerging feature-branch into master (with conflict):");
repo.merge("feature-branch");
// Display the conflicted file
console.log("\nConflicted file content:");
const conflictFile = repo.catFile("conflict.txt");
console.log(conflictFile);
// Test rebase functionality
console.log("\n=== Testing rebase functionality ===");
// Create a new branch from the initial commit
repo.checkout("master");
const initialCommit = repo.log().pop(); // Get the oldest commit
console.log(`Initial commit: ${initialCommit === null || initialCommit === void 0 ? void 0 : initialCommit.id.substring(0, 7)} - ${initialCommit === null || initialCommit === void 0 ? void 0 : initialCommit.message}`);
// Create a branch from the initial commit
repo.checkout("feature-rebase");
repo.createFile("rebase-file1.txt", "First change in rebase branch");
repo.stageAll();
repo.addCommit("First commit in rebase branch");
repo.createFile("rebase-file2.txt", "Second change in rebase branch");
repo.stageAll();
repo.addCommit("Second commit in rebase branch");
// Meanwhile, make changes in master
repo.checkout("master");
repo.createFile("master-new.txt", "New file in master after branch creation");
repo.stageAll();
repo.addCommit("New feature in master");
// Show both branches
console.log("\nMaster branch commits:");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
console.log("\nfeature-rebase commits:");
repo.checkout("feature-rebase");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
// Rebase feature-rebase onto master
console.log("\nRebasing feature-rebase onto master:");
repo.rebase("master");
// Show the rebased history
console.log("\nAfter rebase - feature-rebase commits:");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
// Verify master is still the same
repo.checkout("master");
console.log("\nMaster branch commits (unchanged):");
repo.log().forEach(commit => {
    console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
