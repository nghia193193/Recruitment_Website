"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobLocation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const jobLocSchema = new Schema({
    name: {
        type: String,
        required: true
    }
});
exports.JobLocation = mongoose_1.default.model('JobLocation', jobLocSchema);
