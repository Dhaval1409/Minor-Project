import express from 'express';
import { 
  createBusiness, 
  getBusiness, 
  updateBusiness, 
  deleteBusiness 
} from '../controllers/businessController';

const router = express.Router();

// Maps cleanly to: POST http://localhost:5000/business
router.post('/', createBusiness);

// Maps cleanly to: GET http://localhost:5000/business/:id
router.get('/:id', getBusiness);

// Maps cleanly to: PUT http://localhost:5000/business/:id
router.put('/:id', updateBusiness);

// Maps cleanly to: DELETE http://localhost:5000/business/:id
router.delete('/:id', deleteBusiness);

export default router;