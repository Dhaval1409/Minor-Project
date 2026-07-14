// src/routes/businessRoutes.ts
import express from 'express';
import { 
  createBusiness, 
  getBusiness, 
  updateBusiness, 
  deleteBusiness 
} from '../controllers/businessController';

const router = express.Router();

router.post('/business', createBusiness);
router.get('/business/:id', getBusiness);
router.put('/business/:id', updateBusiness);
router.delete('/business/:id', deleteBusiness);

export default router;