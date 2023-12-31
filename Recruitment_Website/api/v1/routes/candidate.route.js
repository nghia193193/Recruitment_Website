"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidateController = __importStar(require("../controllers/candidate.controller"));
const middleware_1 = require("../middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.get('/resumes', middleware_1.isAuth, candidateController.getResumes);
router.put('/resumes', middleware_1.isAuth, candidateController.uploadResume);
router.delete('/resumes/:resumeId', middleware_1.isAuth, (0, express_validator_1.param)('resumeId').trim().isMongoId().withMessage('Id không hợp lệ'), candidateController.deleteResume);
router.get('/applied-jobs/:jobId', middleware_1.isAuth, [
    (0, express_validator_1.param)('jobId').trim().isMongoId().withMessage('Id không hợp lệ')
], candidateController.checkApply);
router.post('/jobs/:jobId', middleware_1.isAuth, [
    (0, express_validator_1.param)('jobId').trim().isMongoId().withMessage('jobId không hợp lệ'),
    (0, express_validator_1.body)('resumeId').trim().isMongoId().withMessage('resumeId không hợp lệ')
], candidateController.applyJob);
router.get('/jobs/applicants', middleware_1.isAuth, [
    (0, express_validator_1.query)('page').trim()
        .custom((value) => {
        if (value) {
            const regex = /^[0-9]+$/; // Chỉ cho phép số
            if (!regex.test(value)) {
                throw new Error('page không hợp lệ');
            }
            ;
            return true;
        }
        return true;
    }),
    (0, express_validator_1.query)('limit').trim()
        .custom((value) => {
        if (value) {
            const regex = /^[0-9]+$/; // Chỉ cho phép số
            if (!regex.test(value)) {
                throw new Error('limit không hợp lệ');
            }
            ;
            return true;
        }
        return true;
    })
], candidateController.getAppliedJobs);
router.put('/information', middleware_1.isAuth, [], candidateController.saveInformation);
router.get('/information', middleware_1.isAuth, candidateController.getInformation);
router.get('/interviews', middleware_1.isAuth, [
    (0, express_validator_1.query)('page').trim()
        .custom((value) => {
        if (value) {
            const regex = /^[0-9]+$/; // Chỉ cho phép số
            if (!regex.test(value)) {
                throw new Error('page không hợp lệ');
            }
            ;
            return true;
        }
        return true;
    }),
    (0, express_validator_1.query)('limit').trim()
        .custom((value) => {
        if (value) {
            const regex = /^[0-9]+$/; // Chỉ cho phép số
            if (!regex.test(value)) {
                throw new Error('limit không hợp lệ');
            }
            ;
            return true;
        }
        return true;
    })
], candidateController.getAllInterviews);
exports.default = router;
