import Commit from "./commit";

class Branch {
    public name: string;
    public headCommit: Commit | null;

    constructor(name: string, headCommit: Commit | null) {
        this.name = name;
        this.headCommit = headCommit!;
    }
}

export default Branch;