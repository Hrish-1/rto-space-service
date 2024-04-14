import asyncHandler from "../layers/asyncHandler.js";
import Invoice from "../models/invoice.js";

export const getInvoices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 0
  const size = parseInt(req.query.size, 10) || 10
  const keyword = req.query.keyword
    ? {
      customerName: {
        $regex: req.query.keyword,
        $options: 'i',
      },
    }
    : {};

  const excludeFields = new Set(["totalAmount", "discount", "receivedAmount"])

  const totalItems = await Invoice.countDocuments({ ...keyword });
  const items = await Invoice.aggregate([
    {
      $lookup: {
        from: 'partnermasters',
        localField: 'customerId',
        foreignField: 'customerId',
        pipeline: [
          { $match: keyword },
          { $project: { customerName: 1, _id: 0 } }
        ],
        as: 'customers'
      }
    },
    {
      $match: {
        "customers": { $ne: [] }
      }
    },
    { $skip: size * page },
    { $limit: size },
    {
      $project: {
        ...Object.keys(Invoice.schema.obj)
          .filter(key => !excludeFields.has(key))
          .reduce((acc, path) => {
            acc[path] = 1;
            return acc;
          }, {}),
        'customerName': { $arrayElemAt: ["$customers.customerName", 0] },
        'totalAmount': { $toDouble: '$totalAmount' },
        'receivedAmount': { $toDouble: '$receivedAmount' },
        'discount': { $toDouble: '$discount' }
      }
    }
  ]);
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

export const patchInvoice = asyncHandler(async (req, res) => {
  const id = req.params.id
  const invoice = Invoice.findOne({ invoiceNo: id })
  if (!invoice) {
    res.status(404)
    throw new Error('Invoice not found')
  }
  const data = {
    receivedAmount: req.body.receivedAmount,
    discount: req.body.discount
  }
  await Invoice.findOneAndUpdate({ invoiceNo: id }, data)
  return res.status(204).send()
})
