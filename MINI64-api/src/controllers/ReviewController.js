import ReviewService from "../services/ReviewService.js";

class ReviewController {
  async createReview(req, res) {
    try {
      const response = await ReviewService.createReview(
        req.user,
        req.body,
        req.files ?? [],
      );
      return res
        .status(response.status === "OK" ? 200 : 400)
        .json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async getProductReviews(req, res) {
    try {
      const response = await ReviewService.getProductReviews(
        req.params.productId,
        req.query.sort,
      );
      return res
        .status(response.status === "OK" ? 200 : 400)
        .json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }
}

export default new ReviewController();
