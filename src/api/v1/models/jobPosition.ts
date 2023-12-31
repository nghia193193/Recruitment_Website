import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const jobPosSchema = new Schema({
    name: {
        type: String,
        required: true
    }
},{
    timestamps: true
});

export const JobPosition = mongoose.model('JobPosition', jobPosSchema);