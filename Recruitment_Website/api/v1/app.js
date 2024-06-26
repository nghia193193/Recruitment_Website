"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./routes"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const user_1 = require("./models/user");
const config_1 = require("../../config");
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.nizvwnm.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(body_parser_1.default.json());
app.use(config_1.fileConfig);
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use(routes_1.default);
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const result = error.result;
    res.status(status).json({
        success: error.success || false,
        message: message,
        result: result ? { ...result } : null,
        statusCode: status
    });
});
mongoose_1.default.connect(MONGO_URI, { minPoolSize: 5, maxPoolSize: 100 })
    .then(result => {
    app.listen(8080, () => {
        node_schedule_1.default.scheduleJob('*/5 * * * *', () => {
            deleteOtpExpiredUser();
        });
    });
})
    .catch(err => console.log(err));
async function deleteOtpExpiredUser() {
    try {
        const result = await user_1.User.deleteMany({ otpExpired: { $lte: new Date() } });
        console.log(`${result.deletedCount} instances deleted.`);
    }
    catch (err) {
        console.error('Error deleting instances: ', err);
    }
    ;
}
;
