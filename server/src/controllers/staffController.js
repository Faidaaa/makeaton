import { memoryStore } from '../data/store.js';

export const getStaffOverview = async (req, res, next) => {
  try {
    const metrics = memoryStore.getStaffMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};
