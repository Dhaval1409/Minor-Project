import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import Business from '../models/businessModel'; 

// @desc    Get global platform metrics to know when to scale
// @route   GET /admin/metrics
// @access  Private/SuperAdmin
export const getPlatformMetrics = asyncHandler(async (req: Request, res: Response) => {
  const totalBusinesses = await Business.countDocuments();
  
  const activeBots = await Business.countDocuments({ 
    telegramBotToken: { $exists: true, $nin: [null, ""] } 
  });
  
  const businessTypesDistribution = await Business.aggregate([
    { $group: { _id: "$businessType", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const recentSignups = await Business.find()
    .select('name city createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const metrics = {
    totalBusinesses,
    activeBots,
    businessTypesDistribution,
    recentSignups
  };

  res.status(200).json({
    success: true,
    data: metrics,
    message: "Platform metrics retrieved successfully"
  });
});

// @desc    Get a paginated list of all businesses for the admin data table
// @route   GET /admin/businesses
// @access  Private/SuperAdmin
export const getAllBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // FIXED: Explicitly cast the query to a string to satisfy Mongoose strict typing
  const searchParam = req.query.search as string;
  const searchQuery = searchParam 
    ? { name: { $regex: searchParam, $options: 'i' } } 
    : {};

  const businesses = await Business.find(searchQuery)
    .select('name businessType city opens closes telegramBotToken createdAt')
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit);

  const total = await Business.countDocuments(searchQuery);

  const paginationData = {
    businesses,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalRecords: total
  };

  res.status(200).json({
    success: true,
    data: paginationData,
    message: "Businesses list retrieved successfully"
  });
});

// @desc    Broadcast a message/alert to all registered tenants
// @route   POST /admin/broadcast
// @access  Private/SuperAdmin
export const broadcastMessage = asyncHandler(async (req: Request, res: Response) => {
  const { subject, message, channel } = req.body;

  if (!subject || !message) {
    res.status(400).json({
      success: false,
      message: "Subject and message are required."
    });
    return;
  }

  // 1. Get the total count of businesses to know how many people we are alerting
  const totalBusinesses = await Business.countDocuments();

  // 2. IMPORTANT: Here is where you would integrate an email service (like Resend/SendGrid)
  // or insert a new "Notification" document into your database that loads on their dashboard.
  console.log(`📣 [BROADCAST INITIATED via ${channel}]`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  console.log(`Sent to: ${totalBusinesses} tenants.`);

  res.status(200).json({
    success: true,
    message: `Broadcast successfully sent to ${totalBusinesses} businesses!`
  });
});