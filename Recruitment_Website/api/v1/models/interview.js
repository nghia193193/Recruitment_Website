"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interview = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const interviewSchema = new Schema({
    candidateId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobApplyId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    interviewLink: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
exports.Interview = mongoose_1.default.model('Interview', interviewSchema);
