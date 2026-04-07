import Joi from "joi";
import mongoose from "mongoose";
import { ORDER_STATUSES, ORDER_STATUS_VALUES } from "../constants/orderStatus.js";

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...ORDER_STATUS_VALUES)
    .required(),
  note: Joi.string().trim().allow("").max(500).default(""),
  trackingCode: Joi.when("status", {
    is: ORDER_STATUSES.SHIPPING,
    then: Joi.string().trim().max(100).allow(""),
    otherwise: Joi.forbidden(),
  }),
  carrierName: Joi.when("status", {
    is: ORDER_STATUSES.SHIPPING,
    then: Joi.string().trim().max(120).allow(""),
    otherwise: Joi.forbidden(),
  }),
});

const bulkUpdateOrderStatusSchema = Joi.object({
  orderIds: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation"),
    )
    .min(1)
    .required(),
  status: Joi.string()
    .valid(...ORDER_STATUS_VALUES)
    .required(),
  note: Joi.string().trim().allow("").max(500).default(""),
  trackingCode: Joi.when("status", {
    is: ORDER_STATUSES.SHIPPING,
    then: Joi.string().trim().max(100).allow(""),
    otherwise: Joi.forbidden(),
  }),
  carrierName: Joi.when("status", {
    is: ORDER_STATUSES.SHIPPING,
    then: Joi.string().trim().max(120).allow(""),
    otherwise: Joi.forbidden(),
  }),
});

export const validateUpdateOrderStatus = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: "ERR",
      message: "Invalid order id",
    });
  }

  const { error, value } = updateOrderStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: "ERR",
      message: error.details.map((detail) => detail.message).join(", "),
    });
  }

  req.body = value;
  next();
};

export const validateBulkUpdateOrderStatus = (req, res, next) => {
  const { error, value } = bulkUpdateOrderStatusSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: "ERR",
      message: error.details.map((detail) => detail.message).join(", "),
    });
  }

  req.body = value;
  next();
};
