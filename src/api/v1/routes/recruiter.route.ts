import { Router } from "express";
import * as recruiterController from '../controllers/recruiter.controller';
import { body, query } from 'express-validator';
import { JobPosition } from "../models/jobPosition";
import { Job } from "../models/job";
import sanitizeHtml from "sanitize-html";
import { JobType } from "../models/jobType";
import { JobLocation } from "../models/jobLocation";
import { Skill } from "../models/skill";


const router = Router();

router.get('/jobs', [
    query('name').trim()
        .custom((value, {req}) => {
            if (value) {
                const regex = /^[\p{L} ]+$/u; // Cho phép chữ, số và dấu cách
                if (!regex.test(value)) {
                    throw new Error('Tên không được chứa ký tự đặc biệt trừ dấu cách');
                };
                return true
            }
            return true;
        }),
    query('position').trim()
        .custom((value, {req}) => {  
            if (value) {
                return JobPosition.findOne({name: value})
                    .then(pos => {
                        if (!pos) {
                            return Promise.reject(`Failed to convert 'position' with value: '${value}'`)
                        }
                        return true;
                    })   
            }  
            return true        
        }),
    query('type').trim()
        .custom((value, {req}) => {
            if (value) {
                return JobType.findOne({name: value})
                    .then(type => {
                        if (!type) {
                            return Promise.reject(`Failed to convert 'type' with value: '${value}'`)
                        }
                        return true
                    })
            }
            return true
        }),
    query('location').trim()
        .custom((value, {req}) => {
            if (value) {
                return JobLocation.findOne({name: value})
                    .then(loc => {
                        if (!loc) {
                            return Promise.reject(`Failed to convert 'location' with value: '${value}'`)
                        }
                        return true
                    })
            }
            return true
        }),
    query('page').trim()
        .custom((value, {req}) => {
            if (value) {
                const regex = /^[0-9]+$/; // Chỉ cho phép số
                if (!regex.test(value)) {
                    throw new Error('page không hợp lệ');
                };
                return true;
            }
            return true;
        }),
    query('limit').trim()
        .custom((value, {req}) => {
            if (value) {
                const regex = /^[0-9]+$/; // Chỉ cho phép số
                if (!regex.test(value)) {
                    throw new Error('limit không hợp lệ');
                };
                return true;
            }
            return true;
        }),
] ,recruiterController.GetAllJobs);

router.post('/job', [
    body('name').trim()
        .isLength({min: 5, max:50}).withMessage('Tên công việc trong khoảng 5-50 ký tự')
        .custom((value, {req}) => {
            const regex = /^[\p{L} ,\/0-9]+$/u; 
            if (!regex.test(value)) {
                throw new Error('Tên công việc không được chứa ký tự đặc biệt trừ dấu cách');
            };
            return true;
        }),
    body('jobType').trim()
        .notEmpty().withMessage('Vui lòng nhập jobType')
        .custom(async (value, {req}) => {
            const type = await JobType.findOne({name: value})
            if (!type) {
                return Promise.reject(`Failed to convert 'type' with value: '${value}'`)
            }
            return true
        }),
    body('quantity').trim()
        .notEmpty().withMessage('Vui lòng nhập số lượng')
        .isNumeric().withMessage('Số lượng phải là số'),
    body('benefit').trim()
        .isLength({min: 5, max:200}).withMessage('Benefit trong khoảng 5-200 ký tự')
        .custom((value, {req}) => {
            const regex = /^[\p{L} .,\/:0-9]+$/u;
            if (!regex.test(value)) {
                throw new Error('Benefit không được chứa ký tự đặc biệt trừ dấu cách .,/:');
            };
            return true;
        }),
    body('salaryRange').trim()
        .notEmpty().withMessage('Vui lòng điền mức lương')
        .custom((value, {req}) => {
            const regex = /^[A-Za-z0-9\s$-]+$/; 
            if (!regex.test(value)) {
                throw new Error('Salary Range không được chứa ký tự đặc biệt trừ dấu cách $-');
            };
            return true;
        }),
    body('requirement').trim()
        .isLength({min: 5, max:200}).withMessage('Requirement trong khoảng 5-200 ký tự')
        .custom((value, {req}) => {
            const regex = /^[\p{L} .,\/:0-9]+$/u;
            if (!regex.test(value)) {
                throw new Error('Requirement không được chứa ký tự đặc biệt trừ dấu cách .,/:');
            };
            return true;
        }),
    body('location').trim()
        .notEmpty().withMessage('Vui lòng chọn địa điểm')
        .custom(async (value, {req}) => {
            const location = await JobLocation.findOne({name: value})  
            if (!location) {
                throw new Error(`Failed to convert 'location' with value: '${value}'`);
            }
            return true; 
        }),
    body('description').trim()
        .notEmpty().withMessage('Vui lòng nhập description')
        .custom((value, {req}) => {
            const regex = /^[\p{L} .,\/:0-9]+$/u;
            if (!regex.test(value)) {
                throw new Error('Description không được chứa ký tự đặc biệt trừ dấu cách .,/:');
            };
            return true;
        }),
    body('deadline').trim()
        .notEmpty().withMessage('Vui lòng nhập deadline')
        .isDate().withMessage('deadline không hợp lệ'),
    body('position').trim()
        .notEmpty().withMessage('Vui lòng nhập position')
        .custom(async (value, {req}) => {
            const pos = await JobPosition.findOne({name: value})
            if (!pos) {
                throw new Error(`Failed to convert 'position' with value: '${value}'`);
            }
            return true;
        }),
    body('skillRequired')
        .isArray().withMessage('Skills không hợp lệ')
        .custom(async (value: string[], {req}) => {
            const errors = [];
            for (const skill of value) {
                const s = await Skill.findOne({ name: skill });
                if (!s) {
                    errors.push(`Skill: '${skill}' không hợp lệ`);
                }
            }
            if (errors.length > 0) {
                throw new Error(errors[0]);
            }
            return true;
        })
],recruiterController.CreateJob)

export default router;