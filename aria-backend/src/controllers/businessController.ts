// src/controllers/businessController.ts
import { Request, Response } from 'express';
import BusinessModel from '../models/businessModel';
import { v4 as uuidv4 } from 'uuid';

export const createBusiness = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      businessType, 
      city, 
      hours, 
      servicesProvided, 
      telegramBotToken,
      phone 
    } = req.body;

    const business = await BusinessModel.create({
      name,
      businessType,
      city: city || '',
      hours: hours || { opens: '10:00 AM', closes: '08:00 PM' },
      servicesProvided: servicesProvided || [],
      telegramBotToken,
      phone: phone || '',
    });

    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error('Error creating business:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create business',
    });
  }
};

export const getBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error('Error getting business:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get business',
    });
  }
};

export const updateBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const business = await BusinessModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error('Error updating business:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update business',
    });
  }
};

export const deleteBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const business = await BusinessModel.findByIdAndDelete(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting business:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete business',
    });
  }
};

// ◄ ADDED: Services CRUD (name / price / duration / active), scoped to one business.

// Handles GET /business/:id/services
export const getServices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.status(200).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch services',
    });
  }
};

// Handles POST /business/:id/services  { name, price, duration? }
export const addService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, duration } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'name and price are required',
      });
    }

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    business.services.push({
      id: uuidv4(),
      name,
      price,
      duration: duration || '',
      active: true,
    } as any);

    await business.save();

    res.status(201).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error('Error adding service:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add service',
    });
  }
};

// Handles PUT /business/:id/services/:serviceId  { name?, price?, duration?, active? }
export const updateService = async (req: Request, res: Response) => {
  try {
    const { id, serviceId } = req.params;
    const { name, price, duration, active } = req.body;

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const service = business.services.find((s: any) => s.id === serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    if (name !== undefined) service.name = name;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (active !== undefined) service.active = active;

    await business.save();

    res.status(200).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service',
    });
  }
};

// Handles DELETE /business/:id/services/:serviceId
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id, serviceId } = req.params;

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const before = business.services.length;
    business.services = business.services.filter((s: any) => s.id !== serviceId) as any;

    if (business.services.length === before) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    await business.save();

    res.status(200).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete service',
    });
  }
};

// ◄ ADDED: one-time bridge for businesses onboarded before the Services tab
// existed. Copies names from the legacy `servicesProvided: string[]` field
// (still used by the AI bot) into the new `services` array, skipping any
// name that's already present (case-insensitive). Price defaults to 0 so
// the owner can fill in real prices afterward — this never overwrites an
// existing service.
export const importLegacyServices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    const existingNames = new Set(
      business.services.map((s: any) => s.name.trim().toLowerCase())
    );

    const toImport = (business.servicesProvided || []).filter(
      (name) => name && !existingNames.has(name.trim().toLowerCase())
    );

    for (const name of toImport) {
      business.services.push({
        id: uuidv4(),
        name: name.trim(),
        price: 0,
        duration: '',
        active: true,
      } as any);
    }

    if (toImport.length > 0) {
      await business.save();
    }

    res.status(200).json({
      success: true,
      imported: toImport.length,
      data: business.services,
    });
  } catch (error: any) {
    console.error('Error importing legacy services:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import legacy services',
    });
  }
};