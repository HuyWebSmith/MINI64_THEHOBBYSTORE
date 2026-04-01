import Joi from "joi";
import { StatusCodes } from "http-status-codes";
const productSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Tên sản phẩm không được để trống",
    "any.required": "Tên sản phẩm là bắt buộc",
  }),
  image: Joi.string().required().messages({
    "string.empty": "Hình ảnh không được để trống",
  }),

  model3dUrl: Joi.string().allow("").optional(),

  price: Joi.number().min(0).required().messages({
    "number.base": "Giá sản phẩm phải là số",
    "number.min": "Giá sản phẩm không được nhỏ hơn 0",
    "any.required": "Giá sản phẩm là bắt buộc",
  }),

  stock: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Số lượng tồn kho phải là số",
    "number.min": "Số lượng không được nhỏ hơn 0",
  }),

  rating: Joi.number().min(0).max(5).required().messages({
    "number.base": "Đánh giá phải là số",
    "number.min": "Đánh giá thấp nhất là 0",
    "number.max": "Đánh giá cao nhất là 5",
    "any.required": "Đánh giá là bắt buộc",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Mô tả không được để trống",
  }),

  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "ID danh mục không hợp lệ",
      "any.required": "Danh mục là bắt buộc",
    }),

  brand: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "ID thương hiệu không hợp lệ",
      "any.required": "Thương hiệu là bắt buộc",
    }),
});
const validateProduct = (req, res, next) => {
  const { error } = productSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "ERR",
      message: messages,
    });
  }
  next();
};
const validateProductUpdate = (req, res, next) => {
  const { error } = productSchema
    .fork(
      ["name", "image", "price", "rating", "description", "category", "brand"],
      (schema) => schema.optional(),
    )
    .validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "ERR",
      message: messages,
    });
  }
  next();
};
export { productSchema, validateProduct, validateProductUpdate };
