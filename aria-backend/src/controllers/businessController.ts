// src/controllers/businessController.ts
import { Request, Response } from 'express';
import BusinessModel from '../models/businessModel';

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