import { Router } from "express";
import { candidateController } from '../controllers/candidate.controller';
import { isAuth } from '../middleware';
import { body, param, query } from "express-validator";
import sanitizeHtml from "sanitize-html";
import createHttpError from "http-errors";
import { skills } from "../utils";

const router = Router();

router.get('/resumes', isAuth, candidateController.getResumes);
router.put('/resumes', isAuth, candidateController.uploadResume);
router.delete('/resumes/:resumeId', isAuth,
    param('resumeId').trim().isMongoId().withMessage('Id không hợp lệ')
    , candidateController.deleteResume);

router.get('/applied-jobs/:jobId', isAuth, [
    param('jobId').trim().isMongoId().withMessage('Id không hợp lệ')
], candidateController.checkApply);

router.post('/jobs/:jobId', isAuth, [
    param('jobId').trim().isMongoId().withMessage('jobId không hợp lệ'),
    body('resumeId').trim().isMongoId().withMessage('resumeId không hợp lệ')
], candidateController.applyJob);

router.get('/jobs/applicants', isAuth, [
    query('page').trim()
        .custom((value) => {
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
        .custom((value) => {
            if (value) {
                const regex = /^[0-9]+$/; // Chỉ cho phép số
                if (!regex.test(value)) {
                    throw new Error('limit không hợp lệ');
                };
                return true;
            }
            return true;
        })
], candidateController.getAppliedJobs);

router.put('/information', isAuth, [
    body('education').custom((value => {
        if (value.length !== 0) {
            for (let i = 0; i < value.length; i++) {
                value[i].school = sanitizeHtml(value[i].school);
                value[i].major = sanitizeHtml(value[i].major);
                value[i].graduatedYear = sanitizeHtml(value[i].graduatedYear);
            }
        }
        return true;
    })),
    body('experience').custom((value => {
        if (value.length !== 0) {
            for (let i = 0; i < value.length; i++) {
                value[i].companyName = sanitizeHtml(value[i].companyName);
                value[i].position = sanitizeHtml(value[i].position);
                value[i].dateFrom = sanitizeHtml(value[i].dateFrom);
                value[i].dateTo = sanitizeHtml(value[i].dateTo);
            }
        }
        return true;
    })),
    body('certificate').custom((value => {
        if (value.length !== 0) {
            for (let i = 0; i < value.length; i++) {
                value[i].name = sanitizeHtml(value[i].name);
                value[i].receivedDate = sanitizeHtml(value[i].receivedDate);
                value[i].url = sanitizeHtml(value[i].url);
            }
        }
        return true;
    })),
    body('project').custom((value => {
        if (value.length !== 0) {
            for (let i = 0; i < value.length; i++) {
                value[i].name = sanitizeHtml(value[i].name);
                value[i].description = sanitizeHtml(value[i].description);
                value[i].url = sanitizeHtml(value[i].url);
            }
        }
        return true;
    })),
    body('skills').custom((value => {
        if (value.length !== 0) {
            for (let i = 0; i < value.length; i++) {
                if (!skills.includes(value[i])) {
                    throw createHttpError.BadRequest(`Skill: '${value[i]}' không hợp lệ`);
                }
            }
        }
        return true;
    })),
], candidateController.saveInformation);

router.get('/information', isAuth, candidateController.getInformation);

router.get('/interviews', isAuth, [
    query('page').trim()
        .custom((value) => {
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
        .custom((value) => {
            if (value) {
                const regex = /^[0-9]+$/; // Chỉ cho phép số
                if (!regex.test(value)) {
                    throw new Error('limit không hợp lệ');
                };
                return true;
            }
            return true;
        })
], candidateController.getAllInterviews)

router.put('/favorite-jobs/:jobId', isAuth, [
    param('jobId').trim().notEmpty().isMongoId().withMessage('jobId không hợp lệ')
], candidateController.addFavoriteJob);

router.get('/favorite-jobs', isAuth, candidateController.getFavoriteJob);

export default router;

