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
exports.authService = void 0;
const user_1 = require("../models/user");
const role_1 = require("../models/role");
const bcrypt = __importStar(require("bcryptjs"));
const utils_1 = require("../utils");
const sendMail_1 = require("../utils/sendMail");
exports.authService = {
    signUp: async (fullName, email, phone, password) => {
        const emailUser = await user_1.User.findOne({ email: email });
        if (emailUser) {
            const error = new Error('Email đã tồn tại');
            error.statusCode = 409;
            error.result = null;
            throw error;
        }
        ;
        const phoneUser = await user_1.User.findOne({ phone: phone });
        if (phoneUser) {
            const error = new Error('Số điện thoại đã tồn tại');
            error.statusCode = 409;
            error.result = null;
            throw error;
        }
        ;
        const hashedPw = await bcrypt.hash(password, 12);
        const role = await role_1.Role.findOne({ roleName: 'CANDIDATE', isActive: true });
        let otp = '';
        for (let i = 0; i < 6; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        ;
        const otpExpired = new Date(Date.now() + 10 * 60 * 1000);
        const user = new user_1.User({
            fullName: fullName,
            email: email,
            password: hashedPw,
            phone: phone,
            isVerifiedEmail: false,
            isActive: true,
            blackList: false,
            roleId: role ? role._id : undefined,
            otp: otp,
            otpExpired: otpExpired
        });
        await user.save();
        let mailDetails = {
            from: `${process.env.MAIL_SEND}`,
            to: email,
            subject: 'Register Account',
            html: ` 
                <div style="text-align: center; font-family: arial">
                    <h1 style="color: green; ">JOB POST</h1>
                    <h2>Welcome</h2>
                    <span style="margin: 1px">Your OTP confirmation code is: <b>${otp}</b></span>
                    <p style="margin-top: 0px">Click this link below to verify your account.</p>
                    <button style="background-color: #008000; padding: 10px 50px; border-radius: 5px; border-style: none"><a href="https://recruiment-website-vmc4-huutrong1101.vercel.app/otp?email=${email}" style="font-size: 15px;color: white; text-decoration: none">Verify</a></button>
                    <p>Thank you for joining us!</p>
                    <p style="color: red">Note: This link is only valid in 10 minutes!</p>
                </div>
                `
        };
        sendMail_1.transporter.sendMail(mailDetails, err => {
            const error = new Error('Gửi mail thất bại');
            throw error;
        });
        const accessToken = await (0, utils_1.signAccessToken)(user._id);
        return { accessToken };
    },
    verifyOTP: async (email, otp) => {
        const user = await user_1.User.findOne({ email: email });
        if (!user) {
            const error = new Error('Email không chính xác');
            error.statusCode = 400;
            error.result = null;
            throw error;
        }
        ;
        if (user.otp !== otp) {
            const error = new Error('Mã xác nhận không chính xác');
            error.statusCode = 400;
            error.result = null;
            throw error;
        }
        ;
        user.isVerifiedEmail = true;
        user.otpExpired = undefined;
        await user.save();
    },
    login: async (credentialId, password) => {
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        let user;
        if (emailPattern.test(credentialId)) {
            user = await user_1.User.findOne({ email: credentialId }).populate('roleId');
            if (!user) {
                const error = new Error('Email không chính xác');
                error.statusCode = 400;
                error.result = null;
                throw error;
            }
            ;
            if (!user.isVerifiedEmail) {
                const error = new Error('Vui lòng xác nhận email');
                error.statusCode = 422;
                error.result = null;
                throw error;
            }
            ;
        }
        else {
            user = await user_1.User.findOne({ phone: credentialId }).populate('roleId');
            if (!user) {
                const error = new Error('Số điện thoại không chính xác');
                error.statusCode = 400;
                error.result = null;
                throw error;
            }
            ;
            if (!user.isVerifiedEmail) {
                const error = new Error('Vui lòng xác nhận email');
                error.statusCode = 422;
                error.result = null;
                throw error;
            }
            ;
        }
        ;
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Mật khẩu không chính xác');
            error.statusCode = 400;
            error.result = null;
            throw error;
        }
        ;
        const accessToken = await (0, utils_1.signAccessToken)(user._id);
        const refreshToken = await (0, utils_1.signRefreshToken)(user._id);
        await user.save();
        return { accessToken, refreshToken };
    }
};
