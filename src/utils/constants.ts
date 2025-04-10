export enum Actions {
    ADD,
    REMOVE,
    UPDATE,
}

export class CommitChangeAction {
    action: Actions;
    content: string;

    constructor(action: Actions, content: string) {
        this.action = action;
        this.content = content;
    }
}