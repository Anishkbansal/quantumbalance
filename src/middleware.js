import { protect, adminOnly, verificationRequired } from './middleware/authMiddleware.js';

// Export middleware functions
const middleware = {
  authenticate: protect,
  adminOnly,
  verificationRequired
};

export default middleware; 