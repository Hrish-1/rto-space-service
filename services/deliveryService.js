import asyncHandler from "../layers/asyncHandler.js";
import Delivery from "../models/delivery.js";

export const getDeliveries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 0
  const size = parseInt(req.query.size, 10) || 10
  const keyword = req.query.keyword
    ? {
      vehicleNo: {
        $regex: req.query.keyword,
        $options: 'i',
      },
    }
    : {};

  const totalItems = await Delivery.countDocuments({ ...keyword });
  const items = await Delivery.find(keyword)
    .sort({ deliveryDate: -1 })
    .skip(page * size)
    .limit(size)

  const totalPages = Math.ceil(totalItems / size);
  const isFirst = page === 0;
  const isLast = page === Math.max(0, totalPages - 1);

  res.json({
    items,
    page,
    size,
    isFirst,
    isLast,
    totalPages,
    totalItems
  });
})
