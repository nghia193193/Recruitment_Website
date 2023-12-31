"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const eventSchema = new Schema({
    authorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    image: {
        publicId: String,
        url: String
    },
    isActive: {
        type: Boolean,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    startAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});
exports.Event = mongoose_1.default.model('Event', eventSchema);
