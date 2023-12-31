import mongoose from "mongoose";
const Schema = mongoose.Schema;

const jobSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },  
        positionId: {
            type: Schema.Types.ObjectId,
            ref: 'JobPosition',
            required: true
        },
        typeId: {
            type: Schema.Types.ObjectId,
            ref: 'JobType',
            required: true
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        benefit: {
            type: String,
            required: true
        },
        salaryRange: {
            type: String,
            required: true
        },
        requirement: {
            type: String,
            required: true
        },
        locationId: {
            type: Schema.Types.ObjectId,
            ref: 'JobLocation',
            required: true
        },
        description: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            required: true
        },
        deadline: {
            type: Date,
            required: true
        },
        skills: [
            {
                skillId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Skill',
                    required: true
                }
        }]
    },
    {
        timestamps: true
    }
);

export const Job = mongoose.model('Job', jobSchema);