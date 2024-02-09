// Please don't change the pre-written code
// Import the necessary modules here

import { createNewOrderRepo } from "../model/order.repository.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";

export const createNewOrder = async (req, res, next) => {
  // Write your code here for placing a new order
 // Write your code here for placing a new order
 try {
  // Assuming you have the necessary data in the request body
  // Call the repository function to create a new order
  const newOrder = await createNewOrderRepo({
    ...req.body,
    paidAt: new Date(), // Example: Set paidAt to the current date/time
    user: req.user._id,});

  // Respond with the created order
  res.status(201).json({
    success: true,
    order: newOrder,
  });
} catch (error) {
  // Handle errors
  ErrorHandler.handle(res, error);
}
};
