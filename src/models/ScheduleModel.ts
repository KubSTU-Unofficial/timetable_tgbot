import mongoose from "mongoose";

const schema = new mongoose.Schema({
    group: {
        type: String,
        required: true,
    },
    inst_id: {
        type: Number,
        required: true,
    },
    updateDate: {
        type: Date,
        required: true
    },
    days: [{
        daynum: {
            type: Number,
            required: true,
        },
        even: {
            type: Boolean,
            required: true,
        },
        daySchedule: [{
            number: Number,
            time: String,
            name: String,
            paraType: String,
            teacher: String,
            auditory: String,
            remark: String,
            percent: String,
            period: String,
            flow: Boolean
        }]
    }]
}, { collection: "schedules", versionKey: false });

export default mongoose.model("schedules", schema);

