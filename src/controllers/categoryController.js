const path = require('path');
const fs = require('fs');
const CategoryModel = require('../models/categoryModel');

// Get all categories (Public: Anyone can view)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.getAll();
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get single category by ID (Public: Anyone can view)
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.getById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Create new category (Protected: Admin & Superadmin Only)
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Auto generate URL friendly slug from name (Corrected regex to 0-9)
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

        // Check duplicate slug
        const existingCategory = await CategoryModel.getBySlug(slug);
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name/slug already exists'
            });
        }

        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const categoryId = await CategoryModel.create(name, slug, description, image_url);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            categoryId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Update category (Protected: Admin & Superadmin Only)
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await CategoryModel.getById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const updatedName = name || category.name;
        const slug = updatedName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

        let image_url = category.image_url;

        // If a new image is uploaded, remove the old image file from storage
        if (req.file) {
            if (category.image_url) {
                const oldImagePath = path.join(__dirname, '../../', category.image_url);
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('❌ Failed to delete old image file:', err.message);
                    } else {
                        console.log(`🗑️ Old image deleted successfully from uploads: ${category.image_url}`);
                    }
                });
            }
            image_url = `/uploads/${req.file.filename}`;
        }

        const isUpdated = await CategoryModel.update(id, updatedName, slug, description ?? category.description, image_url);

        if (isUpdated) {
            res.status(200).json({
                success: true,
                message: 'Category updated successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update category'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category (Protected: Admin & Superadmin Only)
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch category details first to get the image path
        const category = await CategoryModel.getById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Delete record from the database
        const isDeleted = await CategoryModel.delete(id);

        if (isDeleted) {
            // Delete associated image file from uploads folder if it exists
            if (category.image_url) {
                const imagePath = path.join(__dirname, '../../', category.image_url);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('❌ Failed to delete image file:', err.message);
                    } else {
                        console.log(`🗑️ Category image deleted successfully from uploads: ${category.image_url}`);
                    }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Failed to delete category'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};