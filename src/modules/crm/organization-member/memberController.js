import ApiError from "../../../utils/apiError.js";
import * as organizationMemberService from "./memberService.js";

export const listOrganizationMembers = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const result = await organizationMemberService.listOrganizationMembers({
      organizationId: req.user.organizationId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Organization members fetched successfully",
      data: result.items,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const inviteOrganizationMember = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member = await organizationMemberService.inviteOrganizationMember({
      organizationId: req.user.organizationId,
      actorUserId: req.user._id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Member invited successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const resendOrganizationMemberInvite = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member =
      await organizationMemberService.resendOrganizationMemberInvite({
        organizationId: req.user.organizationId,
        actorUserId: req.user._id,
        memberId: req.params.memberId,
      });

    return res.status(200).json({
      success: true,
      message: "Invite resent successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrganizationMember = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member = await organizationMemberService.createOrganizationMember({
      organizationId: req.user.organizationId,
      actorUserId: req.user._id,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationMemberById = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member = await organizationMemberService.getOrganizationMemberById({
      organizationId: req.user.organizationId,
      memberId: req.params.memberId,
    });

    return res.status(200).json({
      success: true,
      message: "Member fetched successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationMember = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member = await organizationMemberService.updateOrganizationMember({
      organizationId: req.user.organizationId,
      memberId: req.params.memberId,
      actorUserId: req.user._id,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationMemberRoles = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member =
      await organizationMemberService.updateOrganizationMemberRoles({
        organizationId: req.user.organizationId,
        memberId: req.params.memberId,
        actorUserId: req.user._id,
        payload: req.body,
      });

    return res.status(200).json({
      success: true,
      message: "Member roles updated successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationMemberStatus = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const member =
      await organizationMemberService.updateOrganizationMemberStatus({
        organizationId: req.user.organizationId,
        memberId: req.params.memberId,
        actorUserId: req.user._id,
        payload: req.body,
      });

    return res.status(200).json({
      success: true,
      message: "Member status updated successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganizationMember = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const result = await organizationMemberService.deleteOrganizationMember({
      organizationId: req.user.organizationId,
      memberId: req.params.memberId,
      actorUserId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Member deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
