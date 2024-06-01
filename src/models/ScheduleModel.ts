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
        required: true,
        default: new Date()
    },
    data: [{
        "nedtype": {
            "nedtype_id": Number,
            "nedtype_name": String
        },
        "dayofweek": {
            "dayofweek_id": Number,
            "dayofweek_name": String
        },
        "pair": Number,
        "kindofnagr": {
            "kindofnagr_id": Number,
            "kindofnagr_name": String
        },
        "disc": {
            "disc_id": Number,
            "disc_name": String
        },
        "ned_from": Number,
        "ned_to": Number,
        "persent_of_gr": Number,
        "ispotok": Boolean,
        "classroom": String,
        "isdistant": Boolean,
        "teacher": String,
        "comment": String
    }]
}, { collection: "schedules", versionKey: false });

export default mongoose.model("schedules", schema);