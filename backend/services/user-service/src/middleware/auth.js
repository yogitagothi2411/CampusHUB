const jwt = require('jsonwebtoken');
module.exports = function auth(req,res,next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  if (!token) return res.status(401).json({success:false,error:{code:'UNAUTHORIZED',message:'Bearer token required',details:null},request_id:req.requestId});
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'local-dev-secret-change-before-deploy'); next(); }
  catch { return res.status(401).json({success:false,error:{code:'INVALID_TOKEN',message:'Token is invalid or expired',details:null},request_id:req.requestId}); }
};
