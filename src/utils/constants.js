"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitChangeAction = exports.Actions = void 0;
var Actions;
(function (Actions) {
    Actions[Actions["ADD"] = 0] = "ADD";
    Actions[Actions["REMOVE"] = 1] = "REMOVE";
    Actions[Actions["UPDATE"] = 2] = "UPDATE";
})(Actions || (exports.Actions = Actions = {}));
class CommitChangeAction {
    constructor(action, content) {
        this.action = action;
        this.content = content;
    }
}
exports.CommitChangeAction = CommitChangeAction;
