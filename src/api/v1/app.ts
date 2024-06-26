import express, { Application, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import path from 'path';
import routes from './routes';
import helmet from 'helmet';
import cors from 'cors';
import schedule from 'node-schedule';
import { User } from './models/user';
import { fileConfig } from '../../config';
import {v2 as cloudinary} from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config()

const MONGO_URI: string = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.nizvwnm.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

const app: Application = express();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(fileConfig);

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(routes);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const result = error.result;
    res.status(status).json({ 
        success: error.success || false, 
        message: message, 
        result: result ? {...result} : null, 
        statusCode: status 
    });
});

mongoose.connect(MONGO_URI, {minPoolSize: 5 ,maxPoolSize: 100})
    .then(result => {
        app.listen(8080, () => {
            schedule.scheduleJob('*/5 * * * *', () => {
                deleteOtpExpiredUser();
            });
        });
    })
    .catch(err => console.log(err));

async function deleteOtpExpiredUser() {
    try {
        const result = await User.deleteMany({otpExpired: {$lte: new Date()}});
        console.log(`${result.deletedCount} instances deleted.`);
    } catch (err) {
        console.error('Error deleting instances: ', err);
    };
};