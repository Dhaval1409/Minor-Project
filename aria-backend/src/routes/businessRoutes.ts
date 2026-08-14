import express from 'express';
import { 
  createBusiness, 
  getBusiness, 
  updateBusiness, 
  deleteBusiness,
  getServices,
  addService,
  updateService,
  deleteService,
  importLegacyServices
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

// ◄ ADDED: Services CRUD, scoped to one business
// GET    http://localhost:5000/business/:id/services
// POST   http://localhost:5000/business/:id/services
// PUT    http://localhost:5000/business/:id/services/:serviceId
// DELETE http://localhost:5000/business/:id/services/:serviceId
router.get('/:id/services', getServices);
router.post('/:id/services', addService);
router.put('/:id/services/:serviceId', updateService);
router.delete('/:id/services/:serviceId', deleteService);

// ◄ ADDED: one-time import of legacy servicesProvided[] into the new services[] array
// POST http://localhost:5000/business/:id/services/import-legacy
router.post('/:id/services/import-legacy', importLegacyServices);

export default router;