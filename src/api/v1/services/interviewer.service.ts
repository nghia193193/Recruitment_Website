import { User } from "../models/user";
import { QuestionCandidate } from "../models/questionCandidate";
import { Question } from "../models/question";
import { Skill } from "../models/skill";
import { InterviewerInterview } from "../models/interviewerInterview";
import { Interview } from "../models/interview";
import { Job } from "../models/job";
import { JobPosition } from "../models/jobPosition";
import { ResumeUpload } from "../models/resumeUpload";
import { Education } from "../models/education";
import { Experience } from "../models/experience";
import { Certificate } from "../models/certificate";
import { Project } from "../models/project";
import { JobApply } from "../models/jobApply";
import { addFractionStrings } from "../utils";
import mongoose from "mongoose";

export const saveInformation = async (interviewerId: string, education: any, experience: any, certificate: any, project: any, skills: any) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = {
            content: []
        };
        throw error;
    };
    await Education.deleteMany({ candidateId: interviewer._id.toString() });
    await Experience.deleteMany({ candidateId: interviewer._id.toString() });
    await Certificate.deleteMany({ candidateId: interviewer._id.toString() });
    await Project.deleteMany({ candidateId: interviewer._id.toString() });
    interviewer.skills = [];
    await interviewer.save();
    if (education.length !== 0) {
        for (let i = 0; i < education.length; i++) {
            let e = new Education({
                candidateId: interviewer._id.toString(),
                school: education[i].school,
                major: education[i].major,
                graduatedYear: education[i].graduatedYear
            })
            await e.save();
        }
    }
    if (experience.length !== 0) {
        for (let i = 0; i < experience.length; i++) {
            let e = new Experience({
                candidateId: interviewer._id.toString(),
                companyName: experience[i].companyName,
                position: experience[i].position,
                dateFrom: experience[i].dateFrom,
                dateTo: experience[i].dateTo
            })
            await e.save();
        }
    }
    if (certificate.length !== 0) {
        for (let i = 0; i < certificate.length; i++) {
            let c = new Certificate({
                candidateId: interviewer._id.toString(),
                name: certificate[i].name,
                receivedDate: certificate[i].receivedDate,
                url: certificate[i].url,
            })
            await c.save();
        }
    }
    if (project.length !== 0) {
        for (let i = 0; i < project.length; i++) {
            let p = new Project({
                candidateId: interviewer._id.toString(),
                name: project[i].name,
                description: project[i].description,
                url: project[i].url,
            })
            await p.save();
        }
    }
    if (skills.length !== 0) {
        for (let i = 0; i < skills.length; i++) {
            let skill = await Skill.findOne({ name: skills[i].label });
            interviewer.skills.push({ skillId: (skill as any)._id });
        }
        await interviewer.save();
    }
}

export const getInformation = async (interviewerId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = {
            content: []
        };
        throw error;
    };
    const educationList = await Education.find({ candidateId: interviewer._id.toString() });
    const returnEducationList = educationList.map(e => {
        return {
            school: e.school,
            major: e.major,
            graduatedYead: e.graduatedYear
        }
    })
    const experienceList = await Experience.find({ candidateId: interviewer._id.toString() });
    const returnExperienceList = experienceList.map(e => {
        return {
            companyName: e.companyName,
            position: e.position,
            dateFrom: e.dateFrom,
            dateTo: e.dateTo
        }
    })
    const certificateList = await Certificate.find({ candidateId: interviewer._id.toString() });
    const returnCertificateList = certificateList.map(c => {
        return {
            name: c.name,
            receivedDate: c.receivedDate,
            url: c.url
        }
    })
    const projectList = await Project.find({ candidateId: interviewer._id.toString() });
    const returnProjectList = projectList.map(p => {
        return {
            name: p.name,
            description: p.description,
            url: p.url
        }
    })
    let skills = [];
    for (let i = 0; i < interviewer.skills.length; i++) {
        let skill = await Skill.findById(interviewer.skills[i].skillId);
        skills.push({
            skillId: skill?._id.toString(),
            name: skill?.name
        });
    }
    return {
        education: returnEducationList,
        experience: returnExperienceList,
        certificate: returnCertificateList,
        project: returnProjectList,
        skills: skills
    }
}

export const getAllApplicants = async (interviewerId: string, page: number, limit: number) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = {
            content: []
        };
        throw error;
    };
    const applicantLength = await InterviewerInterview.find({ interviewersId: interviewer._id.toString() }).countDocuments();
    if (applicantLength === 0) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Chưa có ứng viên nào ');
        error.statusCode = 200;
        error.result = {
            content: []
        };
        throw error;
    }
    const listInterviews = await InterviewerInterview.find({ interviewersId: interviewer._id.toString() })
        .populate({
            path: 'interviewId',
            model: Interview,
            populate: {
                path: 'candidateId',
                model: User,
                populate: {
                    path: 'skills.skillId',
                    model: Skill
                }
            }
        })
        .populate({
            path: 'interviewId',
            model: Interview,
            populate: {
                path: 'jobApplyId',
                model: Job,
                populate: {
                    path: 'positionId',
                    model: JobPosition
                }
            }
        })
        .populate('interviewersId')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    
    const returnListApplicants = async () => {
        const mappedApplicants = await Promise.all(
            listInterviews.map(async (interview) => {
                try {
                    const educationList = await Education.find({ candidateId: interview.get('interviewId.candidateId._id') });
                    const returnEducationList = educationList.map(e => {
                        return {
                            school: e.school,
                            major: e.major,
                            graduatedYead: e.graduatedYear
                        }
                    })
                    const experienceList = await Experience.find({ candidateId: interview.get('interviewId.candidateId._id') });
                    const returnExperienceList = experienceList.map(e => {
                        return {
                            companyName: e.companyName,
                            position: e.position,
                            dateFrom: e.dateFrom,
                            dateTo: e.dateTo
                        }
                    })
                    const certificateList = await Certificate.find({ candidateId: interview.get('interviewId.candidateId._id') });
                    const returnCertificateList = certificateList.map(c => {
                        return {
                            name: c.name,
                            receivedDate: c.receivedDate,
                            url: c.url
                        }
                    })
                    const projectList = await Project.find({ candidateId: interview.get('interviewId.candidateId._id') });
                    const returnProjectList = projectList.map(p => {
                        return {
                            name: p.name,
                            description: p.description,
                            url: p.url
                        }
                    })
                    let listSkill = [];
                    for (let i = 0; i < interview.get('interviewId.candidateId.skills').length; i++) {
                        listSkill.push({ label: (interview.get('interviewId.candidateId.skills')[i].skillId as any).name, value: i });
                    }
                    const jobApply = await JobApply.findOne({ candidateId: interview.get('interviewId.candidateId._id'), jobAppliedId: interview.get('interviewId.jobApplyId._id') }).populate('resumeId');
                    const interviewerFullNames = interview.interviewersId.map(interviewer => {
                        return (interviewer as any).fullName;
                    })
                    const scoreInterviewer = await QuestionCandidate.find({ interviewId: interview.interviewId._id.toString() });
                    let totalScore;
                    if (scoreInterviewer) {
                        totalScore = "0/0";
                        for (let i=0; i< scoreInterviewer.length; i++) {
                            if (!scoreInterviewer[i].totalScore) {
                                totalScore = null;
                                break;
                            }
                            totalScore = addFractionStrings(totalScore, scoreInterviewer[i].totalScore as string);
                        }
                        if (totalScore) {
                            const [numerator, denominator] = totalScore.split('/').map(Number);
                            if (denominator === 0) {
                                totalScore = null;
                            } else {
                                totalScore = `${(numerator * 100 / denominator).toFixed(0)}/100`;
                            }
                        }
                    } else {
                        totalScore = null;
                    }
                    return {
                        candidateId: interview.get('interviewId.candidateId._id'),
                        candidateFullName: interview.get('interviewId.candidateId.fullName'),
                        position: interview.get('interviewId.jobApplyId.positionId.name'),
                        interviewId: interview.interviewId._id.toString(),
                        interviewerFullNames: interviewerFullNames,
                        date: interview.get('interviewId.time'),
                        state: jobApply?.status,
                        score: totalScore,
                        jobName: interview.get('interviewId.jobApplyId.name'),
                        avatar: interview.get('interviewId.candidateId.avatar.url'),
                        address: interview.get('interviewId.candidateId.address'),
                        about: interview.get('interviewId.candidateId.about'),
                        dateOfBirth: interview.get('interviewId.candidateId.dateOfBirth'),
                        phone: interview.get('interviewId.candidateId.phone'),
                        email: interview.get('interviewId.candidateId.email'),
                        cv: jobApply?.get('resumeId.resumeUpload'),
                        information: {
                            education: returnEducationList,
                            experience: returnExperienceList,
                            certificate: returnCertificateList,
                            project: returnProjectList,
                            skills: listSkill
                        }
                    }
                } catch (error) {
                    console.error(error);
                    return null;
                }
            })
        )
        return mappedApplicants;
    }
    const listApplicants = await returnListApplicants().then(mappedApplicants => {
        return mappedApplicants
    })
    return { applicantLength, listApplicants };
}

export const getSingleApplicant = async (interviewerId: string, candidateId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const candidate = await User.findById(candidateId).populate('skills.skillId');
    if (!candidate) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy ứng viên.');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    const educationList = await Education.find({ candidateId: candidate._id.toString() });
    const returnEducationList = educationList.map(e => {
        return {
            school: e.school,
            major: e.major,
            graduatedYead: e.graduatedYear
        }
    })
    const experienceList = await Experience.find({ candidateId: candidate._id.toString() });
    const returnExperienceList = experienceList.map(e => {
        return {
            companyName: e.companyName,
            position: e.position,
            dateFrom: e.dateFrom,
            dateTo: e.dateTo
        }
    })
    const certificateList = await Certificate.find({ candidateId: candidate._id.toString() });
    const returnCertificateList = certificateList.map(c => {
        return {
            name: c.name,
            receivedDate: c.receivedDate,
            url: c.url
        }
    })
    const projectList = await Project.find({ candidateId: candidate._id.toString() });
    const returnProjectList = projectList.map(p => {
        return {
            name: p.name,
            description: p.description,
            url: p.url
        }
    })
    let listSkill = [];
    for (let i = 0; i < candidate.skills.length; i++) {
        listSkill.push({ label: (candidate.skills[i].skillId as any).name, value: i });
    }
    const returnCandidate = {
        candidateId: candidate._id.toString(),
        candidateName: candidate.fullName,
        avatar: candidate.avatar?.url,
        address: candidate.address,
        about: candidate.about,
        dateOfBirth: candidate.dateOfBirth,
        phone: candidate.phone,
        email: candidate.email,
        information: {
            education: returnEducationList,
            experience: returnExperienceList,
            certificate: returnCertificateList,
            project: returnProjectList,
            skills: listSkill
        }
    }
    return returnCandidate;
}

export const getAllInterviews = async (interviewerId: string, page: number, limit: number) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = {
            content: []
        };
        throw error;
    };

    const interviewLength = await InterviewerInterview.find({ interviewersId: interviewer._id.toString() }).countDocuments();
    if (interviewLength === 0) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Chưa có buổi phỏng vấn nào.');
        error.statusCode = 200;
        error.result = {
            content: []
        };
        throw error;
    }
    const listInterviews = await InterviewerInterview.aggregate([
        { $match: { interviewersId: new mongoose.Types.ObjectId(interviewer._id.toString()) } },
        {
            $lookup: {
                from: 'interviews',
                localField: 'interviewId',
                foreignField: '_id',
                as: 'interviews'
            }
        },
        {
            $lookup: {
                from: 'jobs',
                localField: 'interviews.jobApplyId',
                foreignField: '_id',
                as: 'jobs'
            }
        },
        {
            $lookup: {
                from: 'jobpositions',
                localField: 'jobs.positionId',
                foreignField: '_id',
                as: 'positions'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'interviewersId',
                foreignField: '_id',
                as: 'interviewers'
            }
        },
        { $sort: { 'interviews.updatedAt': -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
    ]);

    const returnListInterviews = listInterviews.map(interview => {
        const listInterviewers = interview.interviewers.map((interviewer: any) => {
            return interviewer.fullName;
        })
        return {
            interviewId: interview.interviewId._id.toString(),
            interviewerInterviewUpdatedAt: interview.updatedAt,
            interviewUpdatedAt: interview.interviews[0].updatedAt,
            jobName: interview.jobs[0].name,
            interviewLink: interview.interviews[0].interviewLink,
            time: interview.interviews[0].time,
            position: interview.positions[0].name,
            state: interview.interviews[0].state,
            interviewersFullName: listInterviewers
        }
    })
    return { interviewLength, returnListInterviews };
}

export const getSingleInterview = async (interviewerId: string, interviewId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };

    const interview = await InterviewerInterview.findOne({ interviewersId: interviewer._id.toString(), interviewId: interviewId })
        .populate({
            path: 'interviewId',
            model: Interview,
            populate: {
                path: 'jobApplyId',
                model: Job,
                populate: {
                    path: 'positionId',
                    model: JobPosition
                }
            }
        })
        .populate({
            path: 'interviewId',
            model: Interview,
            populate: {
                path: 'candidateId',
                model: User,
                populate: {
                    path: 'skills.skillId',
                    model: Skill
                }
            }
        });

    if (!interview) {
        const error: Error & { statusCode?: number, result?: any } = new Error('Không tìm thấy interview');
        error.statusCode = 401;
        error.result = null;
        throw error;
    }
    const educationList = await Education.find({ candidateId: interview.get('interviewId.candidateId._id') });
    const returnEducationList = educationList.map(e => {
        return {
            school: e.school,
            major: e.major,
            graduatedYead: e.graduatedYear
        }
    })
    const experienceList = await Experience.find({ candidateId: interview.get('interviewId.candidateId._id') });
    const returnExperienceList = experienceList.map(e => {
        return {
            companyName: e.companyName,
            position: e.position,
            dateFrom: e.dateFrom,
            dateTo: e.dateTo
        }
    })
    const certificateList = await Certificate.find({ candidateId: interview.get('interviewId.candidateId._id') });
    const returnCertificateList = certificateList.map(c => {
        return {
            name: c.name,
            receivedDate: c.receivedDate,
            url: c.url
        }
    })
    const projectList = await Project.find({ candidateId: interview.get('interviewId.candidateId._id') });
    const returnProjectList = projectList.map(p => {
        return {
            name: p.name,
            description: p.description,
            url: p.url
        }
    })
    let listSkill = [];
    for (let i = 0; i < interview.get('interviewId.candidateId').skills.length; i++) {
        listSkill.push({ label: (interview.get('interviewId.candidateId').skills[i].skillId as any).name, value: i });
    }
    const jobApply = await JobApply.findOne({ candidateId: interview.get('interviewId.candidateId._id'), jobAppliedId: interview.get('interviewId.jobApplyId._id') }).populate('resumeId');
    const returnInterview = {
        interviewId: interview.interviewId._id.toString(),
        jobName: interview.get('interviewId.jobApplyId.name'),
        position: interview.get('interviewId.jobApplyId.positionId.name'),
        Date: interview.get('interviewId.time'),
        interviewLink: interview.get('interviewId.interviewLink'),
        questions: [],
        candidate: {
            candidateId: interview.get('interviewId.candidateId._id'),
            candidateFullName: interview.get('interviewId.candidateId.fullName'),
            avatar: interview.get('interviewId.candidateId.avatar.url'),
            email: interview.get('interviewId.candidateId.email'),
            phone: interview.get('interviewId.candidateId.phone'),
            about: interview.get('interviewId.candidateId.about'),
            address: interview.get('interviewId.candidateId.address'),
            dateOfBirth: interview.get('interviewId.candidateId.dateOfBirth'),
            cv: jobApply?.get('resumeId.resumeUpload') ? jobApply?.get('resumeId.resumeUpload') : null ,
            information: {
                education: returnEducationList,
                experience: returnExperienceList,
                certificate: returnCertificateList,
                project: returnProjectList,
                skills: listSkill
            }
        }
    }
    return returnInterview;
}

export const createQuestion = async (interviewerId: string, content: any, type: any, skill: any, note: any) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const questionSKill = await Skill.findOne({ name: skill });
    const question = new Question({
        interviewerId: interviewer._id.toString(),
        content: content,
        typeQuestion: type,
        skillId: questionSKill?._id.toString(),
        note: note
    });
    await question.save();
    return {
        questionId: question._id.toString(),
        content: content,
        typeQuestion: type,
        skill: skill,
        note: note
    }
}

export const getAllQuestions = async (interviewerId: string, skill: any, type: any, content: any, page: number, limit: number) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = {
            content: []
        };
        throw error;
    };
    const query: any = {
        interviewerId: interviewer._id.toString()
    }
    if (skill) {
        const skillId = await Skill.findOne({ name: skill });
        query['skillId'] = skillId?._id;
    }
    if (type) {
        query['typeQuestion'] = type;
    }
    if (content) {
        query['content'] = new RegExp((content as any), 'i');
    }

    const questionLength = await Question.find(query).countDocuments();
    if (questionLength === 0) {
        const error: Error & { statusCode?: any, success?: any, result?: any } = new Error('Không tìm thấy câu hỏi');
        error.statusCode = 200;
        error.success = true;
        error.result = {
            content: []
        };
        throw error;
    };
    const listQuestions = await Question.find(query).populate('skillId')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const returnListQuestions = listQuestions.map(question => {
        return {
            questionId: question._id.toString(),
            content: question.content,
            typeQuestion: question.typeQuestion,
            skill: question.get('skillId.name'),
            note: question.note
        }
    })
    return { questionLength, returnListQuestions };
}

export const getSingleQuestion = async (interviewerId: string, questionId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const question = await Question.findById(questionId).populate('skillId')
    if (!question) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    const returnQuestion = {
        questionId: question._id.toString(),
        content: question.content,
        typeQuestion: question.typeQuestion,
        skill: question.get('skillId.name'),
        note: question.note
    }
    return returnQuestion;
}

export const updateQuestion = async (interviewerId: string, questionId: string, content: any, type: any, skill: any, note: any) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const questionSKill = await Skill.findOne({ name: skill });
    const question = await Question.findById(questionId);
    if (!question) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    question.content = content;
    question.typeQuestion = type;
    question.skillId = (questionSKill as any)._id;
    question.note = note;
    await question.save();
}

export const deleteQuestion = async (interviewerId: string, questionId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const question = await Question.findById(questionId);
    if (!question) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    const interviewQuestion = await QuestionCandidate.findOne({ 'questions.questionId': questionId });
    if (interviewQuestion) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Câu hỏi này đã tồn tại trong buổi phỏng phấn không thể xóa!');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    await Question.findByIdAndDelete(questionId);
}

export const getSkillQuestion = async (interviewerId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const skills = await Skill.find();
    const returnSkills = skills.map(skill => {
        return skill.name;
    })
    return returnSkills;
}

export const getAssignQuestions = async (interviewerId: string, interviewId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = [];
        throw error;
    };
    const questionCandidate = await QuestionCandidate.findOne({ interviewId: interviewId, owner: interviewer._id.toString() })
        .populate({
            path: 'questions.questionId',
            model: Question,
            populate: {
                path: 'skillId',
                model: Skill
            }
        });
    if (!questionCandidate) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi đã đặt');
        error.statusCode = 409;
        error.result = [];
        throw error;
    }

    const returnQuestions = questionCandidate.questions.map(question => {
        return {
            questionId: (question.questionId as any)._id.toString(),
            content: (question.questionId as any).content,
            typeQuestion: (question.questionId as any).typeQuestion,
            skill: (question.questionId as any).skillId.name,
            note: question.note ? question.note : null,
            score: question.score ? question.score : null
        }
    })
    return returnQuestions;
}

export const assignQuestions = async (interviewerId: string, questions: any, interviewId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const questionCandidate = await QuestionCandidate.findOne({ interviewId: interviewId, owner: interviewer._id.toString() });
    if (!questionCandidate) {
        const questionCandidate = new QuestionCandidate({
            interviewId: interviewId,
            questions: questions,
            owner: interviewer._id.toString(),
        })
        await questionCandidate.save();
    } else {
        for (let i = 0; i < questions.length; i++) {
            questionCandidate.questions.push(questions[i]);
        }
        await questionCandidate.save();
    }
}

export const updateQuestions = async (interviewerId: string, questions: any, interviewId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    };
    const questionCandidate = await QuestionCandidate.findOne({ interviewId: interviewId, owner: interviewer._id.toString() });
    if (!questionCandidate) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi đã đặt');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    questionCandidate.questions = questions;
    await questionCandidate.save();
}

export const deleteAssignQuestion = async (interviewerId: string, questionId: string, interviewId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    }
    const questionCandidate = await QuestionCandidate.findOne({
        interviewId: interviewId,
        owner: interviewer._id.toString(),
    });

    if (!questionCandidate) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi đã đặt');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }

    questionCandidate.questions = questionCandidate.questions.filter((question) => {
        return question.questionId?.toString() !== questionId;
    });

    await questionCandidate.save();
}

export const submitTotalScore = async (interviewerId: string, interviewId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    }
    const questionCandidate = await QuestionCandidate.findOne({
        interviewId: interviewId,
        owner: interviewer._id.toString(),
    });
    if (!questionCandidate) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy câu hỏi đã đặt');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    let totalScore = 0;
    for (let i=0; i<questionCandidate.questions.length; i++) {
        if (!questionCandidate.questions[i].score) {
            const error: Error & { statusCode?: any, result?: any } = new Error('Vui lòng chấm điểm hết câu hỏi');
            error.statusCode = 400;
            error.result = null;
            throw error;
        }
        totalScore += (questionCandidate.questions[i].score as number);
    }
    const submitScore = `${totalScore}/${questionCandidate.questions.length * 10}`;
    questionCandidate.totalScore = submitScore;
    await questionCandidate.save()
    const interview = await Interview.findById(interviewId);
    if (!interview) {
        const error: Error & { statusCode?: any, result?: any } = new Error('Không tìm thấy buổi phỏng vấn');
        error.statusCode = 409;
        error.result = null;
        throw error;
    }
    interview.state = "COMPLETED";
    await interview.save();
}

export const interviewerStatistics = async (interviewerId: string) => {
    const interviewer = await User.findById(interviewerId).populate('roleId');
    if (interviewer?.get('roleId.roleName') !== 'INTERVIEWER') {
        const error: Error & { statusCode?: number, result?: any } = new Error('UnAuthorized');
        error.statusCode = 401;
        error.result = null;
        throw error;
    }
    const interviewNumber = await InterviewerInterview.find({ interviewersId: interviewer._id.toString() }).countDocuments();
    const interviewQuestion = await QuestionCandidate.find({ owner: interviewer._id.toString() });
    let contributedQuestionNumber;
    if (!interviewQuestion) {
        contributedQuestionNumber = 0;
    } else {
        contributedQuestionNumber = interviewQuestion.reduce((totalQuestion, interview) => {
            return totalQuestion + interview.questions.length;
        }, 0)
    }
    const scoredInterviewNumber = await QuestionCandidate.find({ owner: interviewer._id.toString(), totalScore: { $exists: true } }).countDocuments();
    const incompleteInterviewNumber = interviewNumber - scoredInterviewNumber;
    return { interviewNumber, contributedQuestionNumber, scoredInterviewNumber, incompleteInterviewNumber }
}
