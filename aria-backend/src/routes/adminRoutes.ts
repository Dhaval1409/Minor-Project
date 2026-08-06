// import { Router } from 'express';
// import { 
//   getPlatformMetrics, 
//   getAllBusinesses,broadcastMessage 
// } from '../controllers/adminController';

// // If you have authentication middleware, import it here. 
// // Example: import { verifyToken, isAdmin } from '../middleware/auth';

// const router = Router();

// // ==========================================
// // SECURITY NOTE: Protect these routes!
// // ==========================================
// // You should apply middleware here to ensure only you can access this.
// // Example: router.use(verifyToken, isAdmin);

// // Route: GET /admin/metrics
// // Purpose: Fetch global platform stats
// router.get('/metrics', getPlatformMetrics);

// // Route: GET /admin/businesses
// // Purpose: Fetch a paginated list of all registered businesses
// router.get('/businesses', getAllBusinesses);

// // Route: POST /admin/broadcast
// // Purpose: Send an announcement to all users
// router.post('/broadcast', broadcastMessage);

// export default router;


import { Router } from 'express';
import {
  loginAdmin,
  getPlatformMetrics,
  getAllBusinesses,
  broadcastMessage
} from '../controllers/adminController';
import { protectAdmin } from '../middleware/adminAuthMiddleware';

const router = Router();

// ==========================================
// PUBLIC ROUTE
// ==========================================
// Route: POST /admin/login
// Purpose: Authenticate the admin and issue a JWT (role: "admin")
router.post('/login', loginAdmin);

// ==========================================
// PROTECTED ROUTES (require a valid admin JWT)
// ==========================================
router.use(protectAdmin);

// Route: GET /admin/metrics
// Purpose: Fetch global platform stats
router.get('/metrics', getPlatformMetrics);

// Route: GET /admin/businesses
// Purpose: Fetch a paginated list of all registered businesses
router.get('/businesses', getAllBusinesses);

// Route: POST /admin/broadcast
// Purpose: Send an announcement to all users
router.post('/broadcast', broadcastMessage);

export default router;
