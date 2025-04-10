class GitFile {
    public path: string;
    public content: string;

    constructor(path: string, content: string = "") {
        this.path = path;
        this.content = content;
    }


    public update(newContent: string): void {
        this.content = newContent;
    }

    public clone(): GitFile {
        return new GitFile(this.path, this.content);
    }

}


export default GitFile;