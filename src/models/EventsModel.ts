import mongoose from "mongoose";

const schema = new mongoose.Schema({
    groups: [String],
    kurses: [Number],
    inst_ids: [Number],
    name: String,
    date: Date,
    startDate: Date,
    endDate: Date,
    note: {
        type: String,
        default: null
    }
}, { collection: "events" });

export default mongoose.model("events", schema);