# git-service
# Git Simulator

A TypeScript implementation of Git's core functionality for educational purposes. This project simulates Git's internal operations to help understand how version control systems work under the hood.

![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📝 Overview

Git Service Simulator recreates the fundamental mechanics of Git in TypeScript, providing a playground for learning about version control concepts without interacting with the actual file system. It's designed as an educational tool to help developers understand Git's internal model.

## ✨ Features

- **Complete Git Object Model**: Commits, branches, files, and references
- **Core Git Operations**:
  - Staging and committing changes
  - Branching and checkout
  - Merging with automatic conflict detection
  - Rebasing commits between branches
  - Remote repository operations (clone, push, pull)

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/muayad-mahmoud/git-service.git

# Navigate to the project directory
cd git-service

# Install dependencies
npm install

# Run the example
npm run-script run
```

## 💻 Usage Examples

### Creating a Repository and Making Commits

```typescript
// Create a new repository
const repo = new Git("my-project");

// Create and stage files
repo.createFile("README.md", "# My Project\nThis is a sample project");
repo.stageFile("README.md");

// Commit changes
repo.addCommit("Initial commit with README");

// View history
repo.log().forEach(commit => {
  console.log(`${commit.id.substring(0, 7)} - ${commit.message}`);
});
```

### Working with Branches

```typescript
// Create and checkout a new branch
repo.checkout("feature-branch");

// Make changes in the feature branch
repo.createFile("feature.txt", "New feature implementation");
repo.stageAll();
repo.addCommit("Add new feature");

// Switch back to master
repo.checkout("master");
```

### Merging Branches

```typescript
// Merge feature branch into master
repo.checkout("master");
repo.merge("feature-branch");
```

### Handling Merge Conflicts

```typescript
// View a conflict
const conflictFile = repo.catFile("conflict.txt");
console.log(conflictFile);
// Output shows: 
// <<<<<<< HEAD
// Master branch version
// =======
// Feature branch version
// >>>>>>>
```

### Rebasing Branches

```typescript
// Rebase feature branch onto master
repo.checkout("feature-rebase");
repo.rebase("master");
```

## 🔄 Project Structure

- classes
  - repo.ts - Main Git repository class
  - commit.ts - Commit object implementation
  - branch.ts - Branch management
  - git-file.ts - File tracking implementation
- utils
  - constants.ts - Enums and utility classes

## 📚 API Reference

### Git Class

The main class that simulates a Git repository.

```typescript
// Create a new repository
const repo = new Git("repo-name");
```

## 📄 License

MIT License


---

*This project is for educational purposes only and is not intended for production use.*
