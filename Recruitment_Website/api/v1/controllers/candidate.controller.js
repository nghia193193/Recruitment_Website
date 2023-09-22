"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResume = exports.uploadResume = exports.getResumes = void 0;
const express_validator_1 = require("express-validator");
const user_1 = require("../models/user");
const utils_1 = require("../utils");
const cloudinary_1 = require("cloudinary");
const resumeUpload_1 = require("../models/resumeUpload");
const mongoose_1 = __importDefault(require("mongoose"));
const getResumes = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    const accessToken = authHeader.split(' ')[1];
    try {
        const decodedToken = await (0, utils_1.verifyToken)(accessToken);
        const candidate = await user_1.User.findOne({ email: decodedToken.email });
        if (!candidate) {
            const error = new Error('Không tìm thấy user');
            throw error;
        }
        ;
        const resumesLength = await resumeUpload_1.ResumeUpload.find({ candidateId: candidate._id }).countDocuments();
        const resumes = await resumeUpload_1.ResumeUpload.find({ candidateId: candidate.id });
        const listResumes = resumes.map(resume => {
            return {
                resumeId: resume._id.toString(),
                name: resume.name,
                resumeUpload: resume.resumeUpload,
                createdDay: resume.createdAt
            };
        });
        res.status(200).json({ success: true, message: 'Lấy list resumes thành công', result: listResumes, resumesLength: resumesLength, statusCode: 200 });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    ;
};
exports.getResumes = getResumes;
const uploadResume = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    const accessToken = authHeader.split(' ')[1];
    try {
        const decodedToken = await (0, utils_1.verifyToken)(accessToken);
        if (!req.files || !req.files.resumeFile) {
            const error = new Error('Không có tệp nào được tải lên!');
            error.statusCode = 400;
            throw error;
        }
        ;
        const resume = req.files.resumeFile;
        if (!(0, utils_1.isPDF)(resume)) {
            const error = new Error('Resume chỉ cho phép file pdf');
            error.statusCode = 400;
            throw error;
        }
        ;
        const result = await cloudinary_1.v2.uploader.upload(resume.tempFilePath);
        if (!result) {
            const error = new Error('Upload thất bại');
            throw error;
        }
        ;
        const publicId = result.public_id;
        const resumeUrl = cloudinary_1.v2.url(publicId);
        const candidate = await user_1.User.findOne({ email: decodedToken.email });
        if (!candidate) {
            const error = new Error('Không tìm thấy user');
            throw error;
        }
        ;
        const cv = new resumeUpload_1.ResumeUpload({
            candidateId: candidate._id,
            publicId: publicId,
            name: resume.name,
            resumeUpload: resumeUrl
        });
        await cv.save();
        const cvInfo = {
            resumeId: cv._id.toString(),
            name: resume.name,
            resumeUpload: resumeUrl,
            createDate: cv.createdAt
        };
        res.status(200).json({ success: true, message: 'Upload resume thành công', result: cvInfo, statusCode: 200 });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        ;
        next(err);
    }
    ;
};
exports.uploadResume = uploadResume;
const deleteResume = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    const accessToken = authHeader.split(' ')[1];
    const errors = (0, express_validator_1.validationResult)(req);
    try {
        const decodedToken = await (0, utils_1.verifyToken)(accessToken);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 422;
            throw error;
        }
        ;
        const resumeId = new mongoose_1.default.Types.ObjectId(req.params.resumeId);
        const resume = await resumeUpload_1.ResumeUpload.findOne({ _id: resumeId });
        if (!resume) {
            const error = new Error('Không tìm thấy resume');
            throw error;
        }
        ;
        const publicId = resume.publicId;
        const isDelete = await resumeUpload_1.ResumeUpload.findOneAndDelete({ _id: resumeId });
        if (!isDelete) {
            const error = new Error('Xóa resume thất bại');
            throw error;
        }
        ;
        await cloudinary_1.v2.uploader.destroy(publicId);
        res.status(200).json({ success: true, message: 'Xóa resume thành công', statusCode: 200 });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    ;
};
exports.deleteResume = deleteResume;
