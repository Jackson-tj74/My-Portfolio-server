/** @format */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import StatusCodes from 'http-status-codes';

import './database/configs/config.js';
import router from './routes/index.js';
import { handleSuccess } from './utils/responseUtils.js';

dotenv.config({ quiet: true });
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use("/api/v1",router)

app.get(/.*/, (req, res) => {
  return handleSuccess(
    res,
    StatusCodes.OK,
    'WELCOME TO OUR COMMUNITY SERVICE',
    {},
  );
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
