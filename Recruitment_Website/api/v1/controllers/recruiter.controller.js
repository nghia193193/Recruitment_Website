"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteJob = exports.CreateJob = exports.GetAllJobs = void 0;
const utils_1 = require("../utils");
const express_validator_1 = require("express-validator");
const user_1 = require("../models/user");
const jobPosition_1 = require("../models/jobPosition");
const job_1 = require("../models/job");
const jobType_1 = require("../models/jobType");
const jobLocation_1 = require("../models/jobLocation");
const skill_1 = require("../models/skill");
const GetAllJobs = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    const accessToken = authHeader.split(' ')[1];
    try {
        const decodedToken = await (0, utils_1.verifyToken)(accessToken);
        const recruiter = await user_1.User.findOne({ email: decodedToken.email }).populate('roleId');
        if (!recruiter) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 409;
            throw error;
        }
        ;
        if (recruiter.get('roleId.roleName') !== 'RECRUITER') {
            const error = new Error('UnAuthorized');
            error.statusCode = 401;
            throw error;
        }
        ;
        const page = req.query.page ? +req.query.page : 1;
        const limit = req.query.limit ? +req.query.limit : 10;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 400;
            throw error;
        }
        const query = {};
        if (req.query['name']) {
            query['name'] = req.query['name'];
        }
        ;
        if (req.query['type']) {
            const jobType = await jobType_1.JobType.findOne({ name: req.query['type'] });
            query['typeId'] = jobType?._id;
        }
        ;
        if (req.query['position']) {
            const jobPos = await jobPosition_1.JobPosition.findOne({ name: req.query['position'] });
            query['positionId'] = jobPos?._id;
        }
        ;
        if (req.query['location']) {
            const jobLoc = await jobLocation_1.JobLocation.findOne({ name: req.query['location'] });
            query['locationId'] = jobLoc?._id;
        }
        ;
        const jobLength = await job_1.Job.find(query).countDocuments();
        if (jobLength === 0) {
            const error = new Error('Không tìm thấy job');
            error.statusCode = 200;
            error.success = true;
            error.result = {
                content: []
            };
            throw error;
        }
        ;
        const jobs = await job_1.Job.find(query).populate('positionId locationId typeId skills.skillId')
            .skip((page - 1) * limit)
            .limit(limit);
        const listjobs = jobs.map(job => {
            const { _id, skills, positionId, locationId, typeId, ...rest } = job;
            delete rest._doc._id;
            delete rest._doc.skills;
            delete rest._doc.positionId;
            delete rest._doc.locationId;
            delete rest._doc.typeId;
            const listSkills = skills.map(skill => {
                return skill.skillId.name;
            });
            return {
                jobId: _id.toString(),
                position: positionId.name,
                location: locationId.name,
                jobType: typeId.name,
                ...rest._doc,
                skills: listSkills
            };
        });
        res.status(200).json({ success: true, message: 'Successfully', statusCode: 200, result: {
                pageNumber: page,
                totalPages: Math.ceil(jobLength / limit),
                limit: limit,
                totalElements: jobLength,
                content: listjobs
            } });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
exports.GetAllJobs = GetAllJobs;
const CreateJob = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    const accessToken = authHeader.split(' ')[1];
    const { name, jobType, quantity, benefit, salaryRange, requirement, location, description, deadline, position, skillRequired } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
    try {
        const decodedToken = await (0, utils_1.verifyToken)(accessToken);
        const recruiter = await user_1.User.findOne({ email: decodedToken.email }).populate('roleId');
        if (!recruiter) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 409;
            throw error;
        }
        ;
        if (recruiter.get('roleId.roleName') !== 'RECRUITER') {
            const error = new Error('UnAuthorized');
            error.statusCode = 401;
            throw error;
        }
        ;
        if (!errors.isEmpty()) {
            const error = new Error(errors.array()[0].msg);
            error.statusCode = 400;
            throw error;
        }
        const pos = await jobPosition_1.JobPosition.findOne({ name: position });
        const type = await jobType_1.JobType.findOne({ name: jobType });
        const loc = await jobLocation_1.JobLocation.findOne({ name: location });
        let listSkill = [];
        skillRequired.forEach(sk => {
            return skill_1.Skill.findOne({ name: sk })
                .then(s => {
                listSkill.push(s._id.toString());
            });
        });
        const job = new job_1.Job({
            name: name,
            positionId: pos._id.toString(),
            typeId: type._id.toString(),
            authorId: recruiter._id.toString(),
            quantity: +quantity,
            benefit: +benefit,
            salaryRange: salaryRange,
            requirement: requirement,
            locationId: loc._id.toString(),
            description: description,
            isActive: true,
            deadline: deadline,
            skills: listSkill
        });
        console.log(job);
        await job.save();
        res.status(200).json({ success: true, message: "Tạo job thành công" });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
exports.CreateJob = CreateJob;
const DeleteJob = async (req, res, next) => {
};
exports.DeleteJob = DeleteJob;