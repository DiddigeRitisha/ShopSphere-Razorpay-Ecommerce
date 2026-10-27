import { Router } from 'express';
import { z } from 'zod';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * Validates product data before creating or updating a product.
 * Zod checks field types, string lengths, prices, stock, and image URLs.
 * Default values are applied when optional fields are omitted.
 */
const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().max(2000).optional().default(''),
  category: z.string().trim().min(2).max(80),
  price: z.coerce.number().min(0),
  image: z.string().url().optional().or(z.literal('')).default(''),
  stock: z.coerce.number().int().min(0).default(0),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true)
});

/**
 * GET /api/products
 * Retrieves active products with pagination, category filtering,
 * optional text search, and a list of available categories.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Read the requested page and limit, enforcing valid boundaries.
    const page = Math.max(
      1,
      Number.parseInt(req.query.page || '1', 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit || '12', 10) || 12)
    );

    // Only active products are visible in the public product listing.
    const filter = { active: true };

    // Apply category filtering unless the user selects "All".
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }

    // Limit the search text length before passing it to MongoDB text search.
    if (req.query.q) {
      filter.$text = {
        $search: String(req.query.q).slice(0, 100)
      };
    }

    // Fetch the current page, total matching count, and active categories.
    // Promise.all allows these independent database operations to run together.
    const [products, total, categories] = await Promise.all([
      Product.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Product.countDocuments(filter),

      Product.distinct('category', { active: true })
    ]);

    // Return the products and pagination information to the frontend.
    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total,
      categories: ['All', ...categories.sort()]
    });
  })
);

/**
 * GET /api/products/:id
 * Retrieves one active product using its database ID.
 * Returns 404 when the product does not exist or is inactive.
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({
      _id: req.params.id,
      active: true
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found.'
      });
    }

    res.json({ product });
  })
);

/**
 * POST /api/products
 * Creates a product.
 * Both authentication and administrator authorization are required.
 * Invalid request data returns HTTP 400.
 */
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    // Validate the submitted product fields before saving to MongoDB.
    const parsed = productSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid product data.',
        details: parsed.error.flatten()
      });
    }

    // Save the validated product and return HTTP 201 for successful creation.
    const product = await Product.create(parsed.data);

    res.status(201).json({ product });
  })
);

/**
 * PUT /api/products/:id
 * Updates an existing product.
 * Partial validation allows the administrator to update selected fields.
 */
router.put(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    // Validate only the fields supplied in the update request.
    const parsed = productSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid product data.',
        details: parsed.error.flatten()
      });
    }

    // Apply the update, return the updated document, and run model validators.
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      parsed.data,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found.'
      });
    }

    res.json({ product });
  })
);

/**
 * DELETE /api/products/:id
 * Archives a product instead of permanently deleting it.
 * Only authenticated administrators can perform this operation.
 * Archived products are excluded from public product listings.
 */
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found.'
      });
    }

    res.json({
      message: 'Product archived.'
    });
  })
);

// Export the router so the main Express application can register these routes.
export default router;
