import { Router } from "express";
import * as userController from '../controllers/user.controller';
import { body } from "express-validator";
import sanitizeHtml from 'sanitize-html';
import { isAuth } from '../middleware';
const router = Router();

router.get('/profile',isAuth, userController.getProfile);
router.put('/update',isAuth ,[
    body('fullName').trim()
        .isLength({min: 5, max:50}).withMessage('Độ dài của họ và tên trong khoảng 5-50 ký tự'),
    body('address').trim()
        .isLength({max: 200}).withMessage('Độ dài tối đa cho phép là 200'),
    body('dateOfBirth').trim(),
    body('about').trim().customSanitizer((value: string, {req}) => {
        const sanitizedValue = sanitizeHtml(value);
        return sanitizedValue;
    })
], userController.updateProfile);

router.put('/change-password',isAuth, [
    body('newPassword').isLength({min: 8, max: 32}).withMessage('Mật khẩu mới phải có độ dài từ 8-32 ký tự'),
    body('confirmNewPassword').custom((value: string, {req}) => {
        if (value !== req.body.newPassword) {
            throw new Error('Mật khẩu xác nhận không chính xác');
        }
        return true;
    })
]
,userController.changePassword);

router.put('/avatar',isAuth, userController.changeAvatar);

export default router;