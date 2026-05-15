import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../users/user.constant';
import { AnalyticsControllers } from './analytics.controller';

const router = express.Router();

router.get('/platform', auth(USER_ROLE.admin), AnalyticsControllers.platformOverview);
router.get('/vendor', auth(USER_ROLE.vendor, USER_ROLE.admin), AnalyticsControllers.vendorOverview);

export const AnalyticsRoute = router;
