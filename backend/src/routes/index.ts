/**
 * API Routes
 * Mount all resource routes under /api/v1
 */

import { Router } from 'express';
import { authRouter } from './auth.routes';
import { driftRouter } from './drift.routes';
import { alertRouter } from './alert.routes';
import { metricsRouter } from './metrics.routes';

export const apiRoutes = Router();

// Mount routers
apiRoutes.use('/auth', authRouter);
apiRoutes.use('/drifts', driftRouter);
apiRoutes.use('/alerts', alertRouter);
apiRoutes.use('/metrics', metricsRouter);

export default apiRoutes;
