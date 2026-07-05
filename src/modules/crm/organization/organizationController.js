import * as organizationService from "./organizationService.js";
import ApiError from "../../../utils/apiError.js";

export const getMyOrganization = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const organization = await organizationService.getCurrentOrganization({
      organizationId: req.user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Organization fetched successfully",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyOrganization = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      throw new ApiError(400, "No organization found for current user");
    }

    const organization = await organizationService.updateCurrentOrganization({
      organizationId: req.user.organizationId,
      payload: req.body, // already validated by yup middleware
      actorUserId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};
