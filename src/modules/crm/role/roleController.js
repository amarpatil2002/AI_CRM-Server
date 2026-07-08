import mongoose from "mongoose";
import {
  createRoleService,
  deleteRoleService,
  getRoleByIdService,
  getRolesService,
  updateRoleService,
} from "./roleService.js";

const resolveOrganizationId = (req) => {
  return (
    req.user?.organizationId ||
    req.organization?._id ||
    req.organizationId ||
    req.params.organizationId ||
    req.body.organizationId ||
    req.query.organizationId ||
    null
  );
};

export const getRoles = async (req, res, next) => {
  try {
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization id is required",
      });
    }

    const data = await getRolesService({
      organizationId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Roles fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization id is required",
      });
    }

    let createdRole;

    await session.withTransaction(async () => {
      createdRole = await createRoleService({
        currentUserId: req.user._id,
        organizationId,
        payload: req.body,
        session,
      });
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: createdRole,
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization id is required",
      });
    }

    const data = await getRoleByIdService({
      roleId: req.params.roleId,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Role fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization id is required",
      });
    }

    let updatedRole;

    await session.withTransaction(async () => {
      updatedRole = await updateRoleService({
        roleId: req.params.roleId,
        currentUserId: req.user._id,
        organizationId,
        payload: req.body,
        session,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteRole = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization id is required",
      });
    }

    let result;

    await session.withTransaction(async () => {
      result = await deleteRoleService({
        roleId: req.params.roleId,
        currentUserId: req.user._id,
        organizationId,
        session,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};
