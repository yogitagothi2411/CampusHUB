const express=require('express'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'); const openDb=require('./db'); const auth=require('./middleware/auth');
const db=openDb('auth.sqlite',`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('student','organizer','admin')),status TEXT NOT NULL DEFAULT 'Active',student_id TEXT,batch TEXT,branch TEXT,year TEXT,avatar TEXT,title TEXT,club_id TEXT,club_name TEXT,committee TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`); const router=express.Router(); const SECRET=process.env.JWT_SECRET||'local-dev-secret-change-before-deploy';
const users=[['admin@iiitvadodara.ac.in','Campus Admin','admin','admin123'],['organizer@iiitvadodara.ac.in','Campus Organizer','organizer','organizer123'],['student@iiitvadodara.ac.in','Campus Student','student','student123']];
const add=db.prepare('INSERT OR IGNORE INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)'); users.forEach((u,i)=>add.run('demo-'+u[2],u[1],u[0],bcrypt.hashSync(u[3],10),u[2]));
function publicUser(u){const {password_hash,...safe}=u;return safe;}
// Admin-only user directory: GET /internal/users?role=student|organizer&search=&status=&branch=&year=&club_id=
router.get('/',auth,(req,res)=>{
  if(req.user.role!=='admin')return res.status(403).json({success:false,error:{code:'FORBIDDEN',message:'Only admins can list users'}});
  const where=[],args=[];
  const {role,status,branch,year,club_id,search}=req.query;
  if(role){where.push('role=?');args.push(role);}
  if(status){where.push('status=?');args.push(status);}
  if(branch){where.push('branch=?');args.push(branch);}
  if(year){where.push('year=?');args.push(year);}
  if(club_id){where.push('club_id=?');args.push(club_id);}
  if(search){where.push('(name LIKE ? OR email LIKE ? OR student_id LIKE ?)');const q='%'+search+'%';args.push(q,q,q);}
  const rows=db.prepare('SELECT * FROM users'+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY created_at DESC, name').all(...args);
  res.json({success:true,data:rows.map(publicUser)});
});
router.post('/register',(req,res)=>{const {name,email,password,role='student'}=req.body||{}; if(!name||!email||!password)return res.status(422).json({success:false,error:{code:'VALIDATION_ERROR',message:'name, email and password are required'}}); if(!['student','organizer'].includes(role))return res.status(400).json({success:false,error:{code:'INVALID_ROLE',message:'Public registration supports student and organizer only'}}); try{const id=require('crypto').randomUUID();db.prepare('INSERT INTO users(id,name,email,password_hash,role) VALUES(?,?,?,?,?)').run(id,name,email.toLowerCase(),bcrypt.hashSync(password,10),role);return res.status(201).json({success:true,data:publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id))});}catch(e){if(String(e).includes('UNIQUE'))return res.status(409).json({success:false,error:{code:'EMAIL_EXISTS',message:'Email already registered'}});throw e;} });
router.post('/login',(req,res)=>{const {email,password}=req.body||{};const u=db.prepare('SELECT * FROM users WHERE email=?').get(String(email||'').toLowerCase());if(!u||!bcrypt.compareSync(password||'',u.password_hash)||u.status!=='Active')return res.status(401).json({success:false,error:{code:'INVALID_CREDENTIALS',message:'Email or password is incorrect'}});const token=jwt.sign({sub:u.id,role:u.role,email:u.email,name:u.name},SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});res.json({success:true,message:'Login successful',data:{access_token:token,token_type:'bearer',user:publicUser(u)}});});
router.get('/me',auth,(req,res)=>{const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.user.sub);if(!u)return res.status(404).json({success:false,error:{code:'USER_NOT_FOUND',message:'User not found'}});res.json({success:true,data:publicUser(u)});});
router.get('/:id',(req,res)=>{const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);if(!u)return res.status(404).json({success:false,error:{code:'USER_NOT_FOUND',message:'User not found'}});res.json({success:true,data:publicUser(u)});});
router.patch('/:id',auth,(req,res)=>{
  const id=req.params.id;
  if(req.user.sub!==id&&req.user.role!=='admin')return res.status(403).json({success:false,error:{code:'FORBIDDEN',message:'You can only edit your own profile'}});
  const old=db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if(!old)return res.status(404).json({success:false,error:{code:'USER_NOT_FOUND',message:'User not found'}});
  const b=req.body||{};
  const map={name:['name'],avatar:['avatar'],student_id:['student_id','studentId'],batch:['batch'],branch:['branch'],year:['year'],title:['title'],club_name:['club_name','clubName'],committee:['committee']};
  const sets=[],args=[];
  for(const [col,keys] of Object.entries(map)){const k=keys.find(k=>b[k]!==undefined);if(k===undefined)continue;const v=b[k]===null?null:String(b[k]).trim();if(col==='name'&&!v)return res.status(422).json({success:false,error:{code:'VALIDATION_ERROR',message:'name cannot be empty'}});sets.push(col+'=?');args.push(v===''&&col!=='name'?null:v);}
  if(sets.length)db.prepare('UPDATE users SET '+sets.join(',')+' WHERE id=?').run(...args,id);
  res.json({success:true,data:publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id))});
});
router.patch('/:id/status',(req,res)=>{const status=req.body.status;if(!['Active','Inactive'].includes(status))return res.status(422).json({success:false,error:{code:'VALIDATION_ERROR',message:'status must be Active or Inactive'}});db.prepare('UPDATE users SET status=? WHERE id=?').run(status,req.params.id);res.json({success:true});});
module.exports=router;