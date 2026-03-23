import Joi from "joi";
import { StatusCodes } from "http-status-codes";

const registerSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Tên không được để trống",
  }),

  email: Joi.string().email().trim().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
  }),

  password: Joi.string().min(6).required().messages({
    "string.empty": "Password không được để trống",
    "string.min": "Password phải ít nhất 6 ký tự",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Mật khẩu nhập lại không khớp",
    "string.empty": "Vui lòng xác nhận lại mật khẩu",
  }),

  phone: Joi.string().trim().required().messages({
    "string.empty": "Số điện thoại không được để trống",
  }),
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body, {
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

export { registerSchema, validateRegister };
