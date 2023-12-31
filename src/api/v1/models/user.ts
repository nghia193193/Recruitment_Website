import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        gender: String,
        roleId: {
            type: Schema.Types.ObjectId,
            ref: "Role",
        },
        avatar: {
            publicId: String,
            url: String
        },
        skills: [
            {
                skillId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Skill',
                }
        }],
        blackList: Boolean,
        isVerifiedEmail: Boolean,
        address: String,
        dateOfBirth: Date,
        about: String,
        isActive: Boolean,
        information: String,
        resetToken: String,
        resetTokenExpired: Date,
        otp: String,
        otpExpired: Date,
        accessToken: String,
        refreshToken: String
    },
    {
        timestamps: true
    }
);

export const User = mongoose.model('User', userSchema);
