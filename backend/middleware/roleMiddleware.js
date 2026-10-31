/**
 * Role-Based Access Control (RBAC) Middleware.
 * Must be used AFTER the `protect` middleware which sets req.user.
 *
 * Usage:
 *   router.post('/admin-only', protect, requireRole(['admin']), handler);
 *   router.get('/admin-or-staff', protect, requireRole(['admin', 'staff']), handler);
 */
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access restricted. Required role: ${allowedRoles.join(' or ')}.`,
    });
  }

  next();
};

