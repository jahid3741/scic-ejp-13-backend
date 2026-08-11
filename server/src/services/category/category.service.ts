import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/appError.js';

export type TCreateCategoryPayload = {
  name: string;
  description?: string;
  icon?: string;
};

export type TUpdateCategoryPayload = {
  name?: string;
  description?: string;
  icon?: string;
};

const createCategory = async (payload: TCreateCategoryPayload) => {
  const trimmedName = payload.name.trim();

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
      isDeleted: false,
    },
  });

  if (existingCategory) {
    throw new AppError(409, 'Category with this name already exists', [
      {
        path: 'name',
        message: 'Category with this name already exists',
      },
    ]);
  }

  const newCategory = await prisma.category.create({
    data: {
      name: trimmedName,
      description: payload.description || null,
      icon: payload.icon || null,
    },
  });

  return newCategory;
};

const getAllCategories = async (query: { page?: string; limit?: string }) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, parseInt(query.limit || '10', 10));
  const skip = (page - 1) * limit;

  const where = { isDeleted: false };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getCategoryById = async (id: string) => {
  const category = await prisma.category.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  return category;
};

const updateCategory = async (id: string, payload: TUpdateCategoryPayload) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingCategory) {
    throw new AppError(404, 'Category not found');
  }

  if (payload.name !== undefined) {
    const trimmedName = payload.name.trim();

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
        isDeleted: false,
        NOT: {
          id,
        },
      },
    });

    if (duplicateCategory) {
      throw new AppError(409, 'Category with this name already exists', [
        {
          path: 'name',
          message: 'Category with this name already exists',
        },
      ]);
    }
  }

  const updateData: { name?: string; description?: string | null; icon?: string | null } = {};

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.description !== undefined) updateData.description = payload.description || null;
  if (payload.icon !== undefined) updateData.icon = payload.icon || null;

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  return updatedCategory;
};

const softDeleteCategory = async (id: string) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingCategory) {
    throw new AppError(404, 'Category not found');
  }

  // Relation Safety Check: Check if active/non-deleted services exist for this category
  const activeServicesCount = await prisma.service.count({
    where: {
      categoryId: id,
      isDeleted: false,
    },
  });

  if (activeServicesCount > 0) {
    throw new AppError(
      409,
      'Cannot delete category: active services are associated with this category',
      [
        {
          path: 'id',
          message: `Category has ${activeServicesCount} active service(s)`,
        },
      ]
    );
  }

  const deletedCategory = await prisma.category.update({
    where: { id },
    data: { isDeleted: true },
  });

  return deletedCategory;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  softDeleteCategory,
};
