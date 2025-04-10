import GitFile from "./git-file";

class Commit {
    public id: string;
    public message: string;
    public parent: Commit | null; //initially null for first commit
    public files: Map<string, GitFile>;
    public timestamp: Date;
    public secondParent: Commit | null;
    constructor(parent: Commit | null, message: string, files: Map<string, GitFile> = new Map()) {
        this.id = Array.from({ length: 15 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        this.message = message;
        this.parent = parent!;
        this.secondParent = null;
        this.timestamp = new Date();

        this.files = new Map();
        files.forEach((file, path) => {
            this.files.set(path, file.clone());
        });
        
    }

    public getFiles(path: string): GitFile | undefined {
        return this.files.get(path);
    }

    public hasFile(path: string): boolean {
        return this.files.has(path);
    }


}

export default Commit